# Snapshot de repositórios públicos de IA

Coleta: `2026-10-10T11:41:29.358707+00:00`. Fonte: GitHub REST API, acessada pelo Worker local `http://127.0.0.1:8787`.

Este snapshot é observacional. Stars, forks, issues e timestamps mudam; não são métricas de qualidade, contratação ou desempenho. Falhas e redirecionamentos não são removidos: ficam registrados no JSON/CSV.

**Solicitados:** 12 · **Sucesso:** 12 · **Falhas:** 0

| Repositório solicitado | Repositório retornado | Linguagem | Stars | Forks | Issues abertas | Arquivado | Atualizado | Latência (ms) |
| --- | --- | --- | ---: | ---: | ---: | :---: | --- | ---: |
| Aider-AI/aider | [Aider-AI/aider](https://github.com/Aider-AI/aider) | Python | 49.453 | 5.043 | 1.911 | não | 2026-10-10T10:37:25Z | 289.8 |
| continuedev/continue | [continuedev/continue](https://github.com/continuedev/continue) | TypeScript | 36.168 | 5.459 | 832 | não | 2026-10-10T07:55:08Z | 159.0 |
| OpenHands/OpenHands | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | TypeScript | 90.464 | 11.973 | 967 | não | 2026-10-10T11:21:41Z | 180.1 |
| open-webui/open-webui | [open-webui/open-webui](https://github.com/open-webui/open-webui) | Python | 154.179 | 22.559 | 255 | não | 2026-10-10T11:13:08Z | 149.3 |
| cloudflare/workers-sdk | [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) | TypeScript | 4.613 | 1.577 | 558 | não | 2026-10-10T10:17:31Z | 145.7 |
| langchain-ai/langchain | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | Python | 147.552 | 24.758 | 642 | não | 2026-10-10T11:38:22Z | 168.1 |
| run-llama/llama_index | [run-llama/llama_index](https://github.com/run-llama/llama_index) | Python | 52.459 | 8.316 | 904 | não | 2026-10-10T11:28:46Z | 159.8 |
| microsoft/autogen | [microsoft/autogen](https://github.com/microsoft/autogen) | Python | 61.339 | 9.275 | 1.102 | não | 2026-10-10T10:34:51Z | 31.0 |
| Significant-Gravitas/AutoGPT | [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | Python | 187.503 | 45.925 | 695 | não | 2026-10-10T10:04:14Z | 175.4 |
| huggingface/transformers | [huggingface/transformers](https://github.com/huggingface/transformers) | Python | 166.981 | 34.783 | 2.340 | não | 2026-10-10T11:37:12Z | 171.0 |
| vllm-project/vllm | [vllm-project/vllm](https://github.com/vllm-project/vllm) | Python | 93.506 | 23.209 | 8.675 | não | 2026-10-10T11:32:11Z | 340.9 |
| NVIDIA/NeMo (redirecionado) | [NVIDIA-NeMo/Speech](https://github.com/NVIDIA-NeMo/Speech) | Python | 18.568 | 3.642 | 342 | não | 2026-10-10T11:40:26Z | 460.7 |

## Método e limitações

O script consulta uma lista fixa de repositórios públicos, passa cada URL pelo endpoint `/api/fetch`, verifica o status do upstream e interpreta o JSON retornado. A coluna de repositório solicitado é preservada quando a API redireciona ou canonicaliza um endereço. Não há amostragem aleatória nem dados simulados. A lista foi escolhida por relevância ao benchmark do projeto, não como ranking universal.

A latência é medida do processo local até o proxy retornar. Ela inclui rede e tempo de resposta do GitHub naquele instante. Não é p50/p95: para isso seria necessário repetir cada consulta sob um protocolo de carga controlado.

Os arquivos brutos estão em [`data/ai_repositories_snapshot.json`](../data/ai_repositories_snapshot.json) e [`data/ai_repositories_snapshot.csv`](../data/ai_repositories_snapshot.csv).
