# Changelog

## 1.0.0 — reconstrução para portfólio

- Implementado Worker Cloudflare funcional em `workers/fetch-proxy/src/index.ts`.
- Adicionados `/api/health` e `/api/fetch` com formatos `text` e `links`.
- Adicionados validação SSRF, redirects manuais, timeout, limite de 2 MB, CORS e rate limit em memória.
- Adicionada suíte de 16 testes no runtime Cloudflare Workers.
- Adicionados typecheck, lockfile, CI, licença e documentação de segurança.
- Adicionados contratos de tool/contexto/diff e quickstart para recrutadores.
- Preservados APK e `index.html` recuperado como referência.

A implementação do Worker foi reconstruída a partir do README, `wrangler.jsonc`, `vitest.config.ts` e comportamento observado no APK. Ela não deve ser apresentada como o código-fonte original que não foi enviado.
