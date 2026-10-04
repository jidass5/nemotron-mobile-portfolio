# Contrato de tools e mudanças

Este documento define o comportamento que o recrutador consegue inspecionar no fluxo Nemotron. O modelo pode **propor** uma ação, mas a interface e o backend continuam responsáveis por validar escopo e autorização.

## Estados de uma ação

```text
requested → validated → proposed → approved → applied
                    └→ rejected
                    └→ failed
```

Toda ação deve carregar, quando aplicável:

```json
{
  "schema_version": "1.0",
  "request_id": "req_...",
  "conversation_id": "conv_...",
  "tool": "read_file | search_code | propose_edit",
  "mode": "read_only | proposal",
  "repository": "owner/name",
  "ref": "commit-or-branch",
  "path": "src/example.ts",
  "idempotency_key": "..."
}
```

A resposta deve ser estruturada e nunca esconder erro em texto livre:

```json
{
  "request_id": "req_...",
  "status": "ok | blocked | failed",
  "source": "github | upload | worker",
  "bytes": 1234,
  "content": "...",
  "error_code": null,
  "error_message": null
}
```

## Modos de operação

| Modo | Permissões | Resultado esperado |
| --- | --- | --- |
| `read_only` | listar, ler, buscar, consultar URL permitida | evidência e explicação |
| `proposal` | gerar diff, sem escrita automática | proposta revisável |
| `approved_write` | aplicar apenas a proposta aprovada | patch/commit e resultado |

O cliente atual já implementa a parte essencial do modo `proposal`: `propose_edit` cria um diff visual e só copia ou commita depois da ação do usuário. O próximo passo recomendado é trocar commit direto na branch por branch + Pull Request e registrar um `request_id` por operação.

## Contexto lazy de GitHub

O agente não deve receber o repositório inteiro por padrão. A conversa deve registrar:

- repositório e `ref` usado;
- arquivos realmente lidos;
- tamanho enviado ao modelo;
- limite de arquivos e caracteres;
- cache/TTL, quando houver;
- origem de cada trecho;
- resposta de rate limit ou erro do GitHub.

Fixar um commit é preferível a usar somente uma branch, porque torna a explicação e a proposta reproduzíveis. Conteúdo recuperado do repositório é dado externo não confiável; ele não pode redefinir as instruções do sistema.

## Invariantes de segurança

Uma tool mutante deve falhar fechada quando faltar repositório, `ref`, permissão ou confirmação. O modelo não pode escolher sozinho um token, uma branch de produção ou uma URL de destino. O diff deve ser comparado com o conteúdo lido; se o arquivo mudar antes da aplicação, o estado volta para `failed` e exige nova leitura.

Esses padrões seguem a separação de modos Chat/Plan/Agent e o fluxo de permissão documentados pelo Continue, além do envelope ação-observação e das políticas de confirmação descritos no OpenHands SDK. As fontes estão no benchmark do projeto.
