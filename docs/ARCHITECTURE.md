# Arquitetura observada

## Fluxo principal

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as App WebView
    participant G as GitHub API
    participant L as Provedor LLM
    participant W as Fetch Worker

    U->>A: adiciona repositório e pergunta
    A->>G: lista árvore do branch
    G-->>A: caminhos e tamanhos
    L->>A: solicita list_files/read_file
    A->>G: lê arquivo sob demanda
    G-->>A: conteúdo
    A->>L: envia resultado da ferramenta
    L-->>A: resposta em streaming ou propose_edit
    A-->>U: mostra texto e diff
    U->>A: aplica ou descarta
    opt fetch_url
      A->>W: URL externa
      W->>W: valida SSRF, redirect e tamanho
      W-->>A: texto limpo ou links
    end
```

## Limites atuais

- o APK é WebView; não há banco de dados local próprio identificado;
- estado de provedores e token GitHub usa `localStorage`;
- o índice de arquivos é mantido em memória durante a sessão;
- conteúdo de arquivos é carregado e cacheado conforme o modelo pede;
- a escrita é direta no GitHub Contents API ou cópia para clipboard;
- o proxy não renderiza JavaScript de SPAs.

## Telemetria recomendada

Para reforçar o foco em dados, adicionar eventos locais ou opt-in:

| Evento | Campos | Métrica derivada |
|---|---|---|
| `request_started` | provider, model, has_image, file_count | volume por cenário |
| `first_token` | elapsed_ms | time-to-first-token |
| `request_finished` | elapsed_ms, chars_in, chars_out | latência e tamanho |
| `provider_failed` | provider, status | taxa de falha |
| `fallback_used` | from, to | resiliência |
| `tool_called` | tool, result_chars | uso de contexto |
| `edit_reviewed` | action, lines_added, lines_removed | adoção de proposta |

Não registrar prompts, tokens, chaves ou conteúdo privado por padrão.
