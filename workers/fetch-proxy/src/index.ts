export interface Env {
  ALLOWED_ORIGINS?: string;
}

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_CHARS = 20_000;
const MAX_MAX_CHARS = 50_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const rate = new Map<string, { count: number; resetAt: number }>();

const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.0\.0\./,
  /^192\.0\.2\./,
  /^192\.168\./,
  /^198\.18\./,
  /^198\.19\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^224\./,
  /^23[0-9]\./,
  /^255\.255\.255\.255$/,
];

function originAllowed(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const configured = (env.ALLOWED_ORIGINS || "*").split(",").map((v) => v.trim()).filter(Boolean);
  return configured.includes("*") || configured.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({ "Vary": "Origin" });
  const allowed = originAllowed(request, env);
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", allowed);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return headers;
}

function json(request: Request, env: Env, value: unknown, status = 200): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers });
}

function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "anonymous";
}

function consumeRate(request: Request): boolean {
  const now = Date.now();
  const key = clientKey(request);
  const current = rate.get(key);
  if (!current || current.resetAt <= now) {
    rate.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rate.size > 10_000) {
      for (const [entryKey, entry] of rate) if (entry.resetAt <= now) rate.delete(entryKey);
    }
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT;
}

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host.includes(":")) return true; // IPv6 literals are blocked conservatively.
  if (isIpv4(host)) return PRIVATE_IPV4.some((pattern) => pattern.test(host));
  if (!host.includes(".")) return true;
  return false;
}

function validateTarget(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new HttpError(400, "URL inválida"); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new HttpError(400, "somente http e https são permitidos");
  if (url.username || url.password) throw new HttpError(400, "credenciais na URL não são permitidas");
  if (url.port && url.port !== "80" && url.port !== "443") throw new HttpError(400, "porta não permitida");
  if (isBlockedHostname(url.hostname)) throw new HttpError(400, "hostname bloqueado por segurança");
  return url;
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function fetchWithRedirects(initial: URL): Promise<{ response: Response; finalUrl: string }> {
  let current = initial;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "NemotronFetchProxy/1.0" },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, finalUrl: current.toString() };
    if (hop === MAX_REDIRECTS) throw new HttpError(502, "número máximo de redirects excedido");
    const location = response.headers.get("Location");
    if (!location) throw new HttpError(502, "redirect sem Location");
    current = validateTarget(new URL(location, current).toString());
  }
  throw new HttpError(502, "redirect inválido");
}

async function readLimited(response: Response): Promise<string> {
  const declared = Number(response.headers.get("Content-Length") || "0");
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, "corpo maior que 2 MB");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) throw new HttpError(413, "corpo maior que 2 MB");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

function decodeEntities(text: string): string {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

async function htmlToTextAndLinks(html: string, baseUrl: string): Promise<{ text: string; links: { href: string; text: string }[] }> {
  const textParts: string[] = [];
  const links: { href: string; text: string }[] = [];
  let currentLink: { href: string; text: string } | null = null;
  const rewriter = new HTMLRewriter()
    .on("script, style, noscript, svg, template", { element(element) { element.remove(); } })
    .on("a", { element(element) {
      const href = element.getAttribute("href");
      if (!href) return;
      try { currentLink = { href: new URL(href, baseUrl).toString(), text: "" }; } catch { currentLink = null; }
    }, text(text) {
      if (currentLink && !text.lastInTextNode) currentLink.text += text.text;
      else if (currentLink) { currentLink.text += text.text; links.push({ href: currentLink.href, text: currentLink.text.trim() }); currentLink = null; }
    }})
    .onDocument({ text(text) { if (text.text.trim()) textParts.push(text.text); } });
  await rewriter.transform(new Response(html)).arrayBuffer();
  const text = decodeEntities(textParts.join(" ")).replace(/\s+/g, " ").trim();
  return { text, links: links.slice(0, 100) };
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  if (!consumeRate(request)) return json(request, env, { error: "rate limit exceeded" }, 429);
  const query = new URL(request.url).searchParams;
  const rawUrl = query.get("url");
  if (!rawUrl) return json(request, env, { error: "parâmetro url é obrigatório" }, 400);
  const format = query.get("format") || "text";
  if (format !== "text" && format !== "links") return json(request, env, { error: "format deve ser text ou links" }, 400);
  const requestedMax = Number(query.get("maxChars") || DEFAULT_MAX_CHARS);
  const maxChars = Number.isFinite(requestedMax) ? Math.min(MAX_MAX_CHARS, Math.max(500, requestedMax)) : DEFAULT_MAX_CHARS;
  try {
    const target = validateTarget(rawUrl);
    const { response, finalUrl } = await fetchWithRedirects(target);
    const contentType = response.headers.get("content-type") || "";
    if (!/^text\/(html|plain|css|csv|xml)|application\/(json|xml)/i.test(contentType)) throw new HttpError(415, "conteúdo binário não suportado");
    const body = await readLimited(response);
    const parsed = /html/i.test(contentType) ? await htmlToTextAndLinks(body, finalUrl) : { text: decodeEntities(body), links: [] };
    const headers = { url: rawUrl, finalUrl, status: response.status, contentType, text: parsed.text.slice(0, maxChars) };
    if (format === "links") return json(request, env, { ...headers, links: parsed.links });
    return json(request, env, headers);
  } catch (error) {
    if (error instanceof HttpError) return json(request, env, { error: error.message }, error.status);
    if (error instanceof DOMException && error.name === "TimeoutError") return json(request, env, { error: "timeout ao buscar upstream" }, 504);
    return json(request, env, { error: "falha ao buscar upstream" }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (request.method !== "GET") return json(request, env, { error: "método não permitido" }, 405);
    if (url.pathname === "/api/health") return json(request, env, { ok: true, service: "nemotron-fetch-proxy" });
    if (url.pathname === "/api/fetch") return handleFetch(request, env);
    return json(request, env, { error: "not found" }, 404);
  },
};
