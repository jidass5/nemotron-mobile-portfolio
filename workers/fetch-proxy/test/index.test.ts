import { SELF, fetchMock } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Nemotron Fetch Proxy", () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
    fetchMock.deactivate();
  });

  it("responde health", async () => {
    const response = await SELF.fetch("https://worker.test/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "nemotron-fetch-proxy" });
  });

  it("retorna 404 para rota desconhecida", async () => {
    const response = await SELF.fetch("https://worker.test/unknown");
    expect(response.status).toBe(404);
  });

  it("rejeita ausência de url", async () => {
    const response = await SELF.fetch("https://worker.test/api/fetch");
    expect(response.status).toBe(400);
    expect((await response.json() as { error: string }).error).toContain("obrigatório");
  });

  it("rejeita protocolo não HTTP", async () => {
    const response = await SELF.fetch("https://worker.test/api/fetch?url=file%3A%2F%2F%2Fetc%2Fpasswd");
    expect(response.status).toBe(400);
  });

  it("rejeita credenciais na URL", async () => {
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fuser%3Apass%40example.com");
    expect(response.status).toBe(400);
  });

  it("rejeita host local e IP privado", async () => {
    for (const target of ["http://localhost", "http://127.0.0.1", "http://192.168.1.1", "http://10.0.0.1"]) {
      const response = await SELF.fetch(`https://worker.test/api/fetch?url=${encodeURIComponent(target)}`);
      expect(response.status).toBe(400);
    }
  });

  it("rejeita portas diferentes de 80 e 443", async () => {
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com%3A8080");
    expect(response.status).toBe(400);
  });

  it("rejeita formato desconhecido", async () => {
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com&format=xml");
    expect(response.status).toBe(400);
  });

  it("limita maxChars ao intervalo documentado", async () => {
    fetchMock.get("https://example.com").intercept({ path: "/" }).reply(200, "hello", { headers: { "content-type": "text/plain" } });
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com&maxChars=1");
    expect(response.status).toBe(200);
    expect((await response.json() as { text: string }).text).toBe("hello");
  });

  it("retorna texto simples", async () => {
    fetchMock.get("https://example.com").intercept({ path: "/" }).reply(200, "Olá &amp; mundo", { headers: { "content-type": "text/plain" } });
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com");
    expect(response.status).toBe(200);
    const body = await response.json() as { text: string; status: number; finalUrl: string };
    expect(body.text).toBe("Olá & mundo");
    expect(body.status).toBe(200);
    expect(body.finalUrl).toBe("https://example.com/");
  });

  it("rejeita conteúdo binário", async () => {
    fetchMock.get("https://example.com").intercept({ path: "/file" }).reply(200, "binary", { headers: { "content-type": "application/octet-stream" } });
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com%2Ffile");
    expect(response.status).toBe(415);
  });

  it("segue redirect e revalida o destino", async () => {
    fetchMock.get("https://example.com").intercept({ path: "/start" }).reply(302, "", { headers: { Location: "https://example.com/next" } });
    fetchMock.get("https://example.com").intercept({ path: "/next" }).reply(200, "redirected", { headers: { "content-type": "text/plain" } });
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com%2Fstart");
    expect(response.status).toBe(200);
    expect((await response.json() as { finalUrl: string }).finalUrl).toBe("https://example.com/next");
  });

  it("bloqueia redirect para host privado", async () => {
    fetchMock.get("https://example.com").intercept({ path: "/start" }).reply(302, "", { headers: { Location: "http://127.0.0.1/admin" } });
    const response = await SELF.fetch("https://worker.test/api/fetch?url=https%3A%2F%2Fexample.com%2Fstart");
    expect(response.status).toBe(400);
  });

  it("inclui CORS para origem permitida por padrão", async () => {
    const response = await SELF.fetch(new Request("https://worker.test/api/health", { headers: { Origin: "https://portfolio.example" } }));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://portfolio.example");
  });

  it("responde OPTIONS", async () => {
    const response = await SELF.fetch(new Request("https://worker.test/api/health", { method: "OPTIONS" }));
    expect(response.status).toBe(204);
  });

  it("rejeita método diferente de GET", async () => {
    const response = await SELF.fetch(new Request("https://worker.test/api/health", { method: "POST" }));
    expect(response.status).toBe(405);
  });
});
