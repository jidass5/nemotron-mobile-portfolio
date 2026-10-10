# Quickstart para recrutadores

## Pré-requisitos

Node.js 22 ou superior e npm. Nenhuma chave de API é necessária para rodar os testes do Worker.

## Validar o Worker em dois minutos

```bash
cd workers/fetch-proxy
npm ci
npm run typecheck
npm test
```

O resultado esperado é `17 tests passed` executados pelo pool Cloudflare Workers.

## Explorar a API local

```bash
npx wrangler dev --local
```

Em outro terminal:

```bash
curl http://localhost:8787/api/health
curl 'http://localhost:8787/api/fetch?url=https%3A%2F%2Fexample.com&format=text'
```

O segundo endpoint retorna JSON com URL original, URL final, status, content type e texto limitado. Hosts locais, IPs privados, credenciais na URL, portas não permitidas, conteúdo binário e métodos HTTP diferentes de GET são rejeitados.

## O que observar no código

- `workers/fetch-proxy/src/index.ts`: validação de alvo, redirects, limite de corpo, parsing e respostas HTTP;
- `workers/fetch-proxy/test/index.test.ts`: casos de segurança e comportamento;
- `docs/SECURITY.md`: limites e recomendações para produção;
- `docs/TOOL_CONTRACT.md`: contrato de contexto lazy e proposta de diff;
- `recovered-app/index.html`: interface web recuperada do APK original.

O cliente Android original não foi enviado como projeto-fonte. O APK e a interface extraída estão preservados apenas como artefatos de referência.
