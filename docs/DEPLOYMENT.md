# Deploy e entrega

O repositório não afirma ter uma URL pública enquanto não houver credenciais Cloudflare configuradas. O Wrangler local confirmou que a sessão atual não está autenticada; por isso, nenhum deploy fictício ou endpoint inexistente é apresentado como demo.

## Deploy local autorizado

```bash
cd workers/fetch-proxy
npm ci
npm run typecheck
npm test
npx wrangler login
npx wrangler deploy
```

O comando abre a autorização oficial do Cloudflare. Não grave tokens no Git, em `.dev.vars` commitado ou no APK.

## Deploy pelo GitHub Actions

O workflow `.github/workflows/deploy.yml` é acionado manualmente ou por uma tag `worker-v*`. Configure estes secrets no repositório:

- `CLOUDFLARE_API_TOKEN`, com permissão mínima para Workers Scripts;
- `CLOUDFLARE_ACCOUNT_ID` da conta de destino.

O job roda typecheck e testes antes do deploy. Sem os dois secrets, ele falha de forma explícita em vez de publicar uma falsa evidência de deployment.

Depois do primeiro deploy, registre a URL real na documentação e repita `scripts/real_data_validation.py` contra ela usando `PROXY_BASE=https://sua-url.workers.dev`. Essa rodada deve ser identificada separadamente da validação local.

## Configuração de produção recomendada

Defina `ALLOWED_ORIGINS` para as origens reais do cliente. Para reduzir a superfície de saída, defina `ALLOWED_HOSTS` como uma lista separada por vírgula, por exemplo:

```text
api.github.com,raw.githubusercontent.com,example.com
```

A allowlist é aplicada novamente em cada redirect. Sem `ALLOWED_HOSTS`, o Worker mantém o modo de demonstração compatível com fontes públicas gerais, mas a limitação de DNS/egress descrita em `SECURITY.md` continua válida.
