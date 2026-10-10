# Validação com dados públicos reais

**Data da execução:** 10 de outubro de 2026  
**Ambiente:** Worker local via Wrangler, runtime Cloudflare Workers  
**Credenciais:** nenhuma  
**Escopo:** requisições públicas `GET` contra GitHub, Cloudflare Developers e Example Domain, com tentativas controladas de SSRF e entradas inválidas.

## Resultado para recrutadores

A validação demonstrou que o framework não depende somente de mocks. Ele buscou conteúdo real pela rede, preservou status e URL final, aplicou limite de caracteres, aceitou HTML, texto puro e JSON, e recusou alvos perigosos antes de abrir a conexão.

Foram executados **10 cenários**. Os cinco cenários de dados públicos retornaram HTTP 200 do proxy e status 200 do upstream. Os cinco cenários de segurança/validação foram rejeitados com HTTP 400, sem chamada ao upstream. O tempo observado variou de **~93 ms a ~1.318 ms** por requisição no ambiente local, dependendo da fonte pública e da resposta de rede. Esses tempos são uma fotografia desta execução, não uma promessa de latência de produção.

| Caso | Fonte ou entrada | Resultado | Evidência observada |
| --- | --- | --- | --- |
| Health | `/api/health` | 200 | serviço respondeu `ok: true` |
| README do Aider | `raw.githubusercontent.com/Aider-AI/aider/main/README.md` | 200 / upstream 200 | 4.996 caracteres; marcadores `aider`, `Installation` e `Git` encontrados |
| Exemplos Vitest Cloudflare | `raw.githubusercontent.com/cloudflare/workers-sdk/.../README.md` | 200 / upstream 200 | 4.071 caracteres; marcadores `Vitest`, `Workers` e `test` encontrados |
| README OpenHands | `raw.githubusercontent.com/OpenHands/OpenHands/main/README.md` | 200 / upstream 200 | 5.000 caracteres; marcadores `OpenHands` e `agent` encontrados |
| API pública GitHub | `api.github.com/repos/cloudflare/workers-sdk` | 200 / upstream 200 | JSON real; campos `full_name` e `stargazers_count` encontrados |
| Example Domain | `example.com` | 200 / upstream 200 | 340 caracteres; `Example Domain` encontrado |
| Loopback | `http://127.0.0.1/` | 400 | `hostname bloqueado por segurança` |
| IP privado | `http://192.168.1.1/` | 400 | `hostname bloqueado por segurança` |
| Credenciais na URL | `https://user:pass@example.com/` | 400 | `credenciais na URL não são permitidas` |
| Porta não permitida | `https://example.com:8443/` | 400 | `porta não permitida` |
| Formato inválido | `format=markdown` | 400 | `format deve ser text ou links` |

## Qualidade do conteúdo

A validação semântica usou marcadores esperados em fontes conhecidas. Os três READMEs raw passaram todos os marcadores definidos. A API do GitHub passou dois de três marcadores: `full_name` e `stargazers_count` apareceram no recorte de 5.000 caracteres; `license` ficou fora do recorte. Isso é comportamento esperado do limite de saída, não falha de conectividade.

A página HTML renderizada de GitHub e a documentação Cloudflare também responderam, mas entregaram bootstrap JavaScript no início do documento. Por isso, para alimentar contexto de modelo ou uma análise textual, o caminho recomendado é buscar endpoints `raw.githubusercontent.com`, APIs JSON ou páginas de conteúdo estático. O resultado é uma limitação documentada do dado de origem, não uma falsa alegação de que todo HTML moderno será convertido em texto editorial limpo.

## Como reproduzir

```bash
cd workers/fetch-proxy
npm ci
npx wrangler dev --local --port 8787
```

Em outro terminal:

```bash
python3 scripts/real_data_validation.py
```

O script salva os resultados detalhados em `docs/REAL_DATA_VALIDATION.json` e `docs/REAL_DATA_SEMANTIC.json`. Nenhum token é necessário.

## Limitações

Esta é uma validação local contra fontes públicas no momento indicado. Ela não mede disponibilidade de um deployment Cloudflare, carga concorrente, p95 estatístico, DNS rebinding real ou comportamento atrás de um egress corporativo. Para produção, permanecem as limitações descritas em [`SECURITY.md`](SECURITY.md), especialmente a ausência de resolução DNS própria para bloquear um hostname público que resolva para IP privado.
