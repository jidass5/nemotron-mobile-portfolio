# Auditoria técnica do portfólio

## Escopo analisado

- `NemotronMobile.apk` recebido em 04/10/2026;
- `README.md` do projeto Fetch Proxy v3 — Cloudflare Workers;
- conteúdo extraído de `assets/index.html`.

## Evidências confirmadas

### APK

- tamanho aproximado: 50 KB;
- contém `AndroidManifest.xml`, `classes.dex`, ícones e um único `assets/index.html` de aproximadamente 61 KB;
- o bytecode referencia `MainActivity`, `FileChooserChromeClient`, `WebView`, JavaScript habilitado e `file:///android_asset/index.html`;
- portanto, o app entregue é principalmente uma interface web empacotada em WebView.

### Cliente

Funcionalidades observadas no código:

- provedores OpenRouter, NVIDIA e endpoint customizado;
- streaming de respostas;
- ferramentas para listar, ler e buscar arquivos;
- carregamento lazy de árvores GitHub;
- upload de arquivos e imagens;
- proposta de edição com diff;
- cópia da edição para clipboard;
- commit via GitHub Contents API quando há token;
- fallback entre provedores;
- persistência de provedores e token GitHub em `localStorage`.

### Worker

Segundo o README entregue:

- endpoints `/api/fetch` e `/api/health`;
- redirects revalidados manualmente;
- filtros SSRF para IPv4/IPv6 e portas;
- leitura streaming com limite de 2 MB;
- HTMLRewriter para extração de texto;
- rate limiting e CORS configurável;
- 63 testes no runtime real do Workers.

### Configuração de testes recebida

O arquivo recebido utilizava a API `cloudflareTest`. Durante a reconstrução,
essa API não estava disponível em runtime na versão instalada do pacote
`@cloudflare/vitest-pool-workers` (0.8.71). A configuração foi atualizada para
o export suportado `defineWorkersConfig` e continua utilizando o mesmo pool
Cloudflare:

```ts
defineWorkersConfig({
  test: {
    pool: "@cloudflare/vitest-pool-workers",
    poolOptions: { workers: { wrangler: { configPath: "./wrangler.jsonc" } } },
  },
})
```

Os testes estão em `test/**/*.test.ts`. A suíte reconstruída foi executada com
sucesso: **16 testes passando no runtime Cloudflare**.

O `wrangler.jsonc` recebido confirma:

- Worker `nemotron-fetch-proxy`;
- entrypoint `src/index.ts`;
- `compatibility_date` de 2025-03-07;
- `nodejs_compat` habilitado;
- observabilidade habilitada com `head_sampling_rate: 1`;
- nenhum binding externo declarado.

Esse último ponto é coerente com a limitação já descrita no README: o rate
limit atual provavelmente é mantido em memória por isolate, não de forma
global. Também significa que o repositório ainda precisa fornecer `src/index.ts`
para que a configuração seja executável.

## Pontos fortes para recrutadores

1. **Problema real e demonstrável:** reduzir o trabalho de entender um repositório com ajuda de LLM.
2. **Integração ponta a ponta:** cliente, APIs externas, proxy serverless e fluxo de edição.
3. **Segurança considerada desde o desenho:** SSRF, limites, redirects, CORS e confirmação humana.
4. **Boa narrativa de engenharia:** o README original compara v2 e v3 e quantifica os testes.

## Riscos e lacunas

### Reprodutibilidade

O código original do Worker, `package.json` e arquivos de teste não foram
recebidos; a implementação, os testes e o `package.json` desta pasta foram
reconstruídos a partir da especificação disponível. O projeto Android original
ainda não foi recuperado. A reconstrução agora executa `npm install`,
`npm run typecheck` e `npm test` com 16 testes passando.

**Ação:** publicar ambos os fontes, adicionar lockfile, `.env.example`, CI e um quickstart validado do zero.

### Credenciais

O cliente salva chaves de provedores e token GitHub em `localStorage` e faz chamadas diretamente do dispositivo. Um token inserido no app pode ser extraído de um aparelho comprometido ou de um backup WebView.

**Ação:** para demo pública, usar tokens de teste de escopo mínimo e deixar explícito que é protótipo. Para produção, mover credenciais para backend e usar OAuth/GitHub App.

### Commit direto

A aplicação usa GitHub Contents API e pode escrever diretamente na branch carregada. Isso é conveniente para demo, mas é menos seguro e menos alinhado ao fluxo profissional de revisão.

**Ação:** criar branch efêmera e abrir Pull Request; incluir resumo, arquivos alterados e checks.

### Prompt injection

O próprio README reconhece que conteúdo externo é não confiável. O cliente permite `fetch_url` e lê conteúdo de repositórios, mas não há no material analisado uma separação visual forte entre dados recuperados e instruções do sistema.

**Ação:** marcar fontes externas como dados não confiáveis, delimitar conteúdo no prompt, filtrar instruções de ação e exigir revisão humana para qualquer escrita.

### Dependência externa

O cliente depende de URLs públicas, provedores de LLM, GitHub API, Google Fonts e um proxy hospedado. Isso pode dificultar a avaliação offline.

**Ação:** incluir modo demo/mock com respostas determinísticas e fixtures locais.

## Plano de entrega para GitHub

### Estrutura recomendada

```text
nemotron-mobile/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── .github/workflows/ci.yml
├── apps/
│   ├── android/          # fonte do WebView e build do APK
│   └── web/              # index.html ou fonte web
├── workers/fetch-proxy/
│   ├── src/
│   ├── test/
│   ├── package.json
│   ├── package-lock.json
│   └── wrangler.jsonc
├── evals/
│   ├── fixtures/
│   └── README.md
└── docs/
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    └── PORTFOLIO_AUDIT.md
```

### Critérios de pronto

- clone limpo em Ubuntu/macOS/Windows;
- `npm ci` funciona sem chaves secretas;
- `npm test` e `npm run typecheck` passam;
- `npm run build` gera o cliente;
- `npm run dev` sobe o Worker local;
- README possui GIF ou screenshots do fluxo;
- CI executa testes em cada pull request;
- nenhuma chave aparece no histórico do Git;
- limitações e ameaças conhecidas estão documentadas.

## Como apresentar em entrevista

> “Construí um cliente mobile para exploração assistida de repositórios. O desafio não era apenas chamar um LLM: eu precisava controlar contexto, custo, latência, falhas de provedor e segurança. Implementei leitura lazy, streaming, tool calling e revisão humana de diffs. Para páginas externas, criei um Worker com validação de redirects, bloqueio SSRF, leitura em streaming, limite de corpo e testes no runtime real. Como próximos passos, moveria credenciais ao backend e trocaria commit direto por Pull Request.”
