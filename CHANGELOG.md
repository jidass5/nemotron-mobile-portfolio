
## 1.1.0 — entrega e hardening

- Adicionada `ALLOWED_HOSTS` opcional, aplicada novamente em cada redirect.
- Adicionados `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.
- Adicionado teste de allowlist; suíte passou a 17 testes no runtime Workers.
- Adicionado workflow de deploy Cloudflare condicionado a secrets explícitos.
- Adicionada documentação de deploy local e por GitHub Actions.
- Atualizada a documentação para declarar que não existe deployment público sem autenticação Cloudflare.
- Corrigidas referências históricas de contagem de testes.
