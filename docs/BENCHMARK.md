# Benchmark de projetos de portfólio alinhados

A análise comparou cinco referências públicas próximas do Nemotron Mobile + Fetch Proxy: Continue, Aider, OpenHands, Open WebUI e os exemplos oficiais de testes do Cloudflare Workers. O objetivo não foi copiar funcionalidades, mas identificar o que um recrutador consegue verificar em poucos minutos.

## Padrões que se repetem

Os melhores projetos têm um README curto e executável, um quickstart ponta a ponta, um mapa de diretórios e links diretos para código, testes, segurança e demo. Eles mostram fronteiras claras entre interface, núcleo do agente, contexto, ferramentas, diff, rede e avaliação.

Também há uma separação consistente entre ferramentas de leitura e ações mutantes. Continue diferencia Chat, Plan e Agent; OpenHands usa ações e observações tipadas com políticas de confirmação; Aider combina edição, lint, teste e histórico Git. Para o Nemotron, isso reforça o modo proposal-first: o modelo gera um diff, o usuário revisa, e somente uma ação explícita pode aplicar a mudança.

Outro padrão é contexto incremental. Continue seleciona contexto do workspace conforme a tarefa; Aider usa um repo map com orçamento de tokens; o Nemotron já parte de uma leitura lazy do GitHub. A melhoria necessária é transformar isso em contrato: ref/commit, arquivos lidos, bytes enviados, limites, cache e evidência apresentada ao usuário.

Na camada de qualidade, os projetos maduros combinam typecheck/lint, testes unitários, integração em runtime próximo da produção, mocks de rede, e2e, build e smoke test. Os exemplos oficiais do Cloudflare Workers mostram explicitamente a diferença entre testar o handler diretamente e executar `exports.default.fetch()` no runtime Workers.

Na segurança, o benchmark mostrou três fronteiras distintas. Continue protege ferramentas e contexto com permissões e escopos. OpenHands trata execução, filesystem e rede como riscos que exigem workspace isolado. Para o Fetch Proxy, o foco é SSRF: esquema e porta permitidos, DNS/IP privado, redirects revalidados, timeout, tamanho, content-type e logs sem segredos.

## O que foi aplicado ao Nemotron

Este repositório agora inclui `docs/TOOL_CONTRACT.md`, um quickstart mais claro no README, `docs/SECURITY.md`, CI, testes no runtime Workers e documentação da arquitetura. O Worker reconstruído expõe 16 testes passando, incluindo validação de URL, hosts privados, credenciais, portas, redirects, conteúdo binário, CORS e métodos HTTP.

Não foram copiados RBAC, indexação completa, execução de terminal, workspaces remotos ou múltiplos produtos. Isso preserva a narrativa: **um fluxo móvel de exploração assistida de código, com contexto lazy, revisão de diff e uma fronteira serverless de leitura segura**.

## Melhorias ainda recomendadas

A próxima evolução técnica é mover tokens para um backend ou GitHub App, trocar commit direto por branch + Pull Request, pinar `ref` em commit, adicionar um harness de tarefas fixadas e publicar métricas medidas. Métricas úteis são tempo até primeiro token, p50/p95 do fetch, tamanho de contexto, taxa de erro do tool loop, taxa de diff aplicável e bloqueios SSRF por categoria. Nenhum número deve ser publicado sem método, versão, commit e data.

## Fontes

[1]: https://github.com/continuedev/continue "Continue — repositório oficial"
[2]: https://docs.continue.dev/ide-extensions/agent/how-it-works "Continue — fluxo de Agent e permissões"
[3]: https://github.com/Aider-AI/aider "Aider — repositório oficial"
[4]: https://aider.chat/docs/repomap.html "Aider — repo map e orçamento de contexto"
[5]: https://github.com/OpenHands/software-agent-sdk "OpenHands SDK — repositório oficial"
[6]: https://docs.openhands.dev/sdk/arch/tool-system "OpenHands — sistema de tools"
[7]: https://docs.openhands.dev/sdk/arch/security "OpenHands — arquitetura de segurança"
[8]: https://github.com/open-webui/open-webui "Open WebUI — repositório oficial"
[9]: https://docs.openwebui.com/getting-started/advanced-topics/hardening "Open WebUI — hardening"
[10]: https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples "Cloudflare Workers — exemplos Vitest"
[11]: https://developers.cloudflare.com/workers/testing/vitest-integration/ "Cloudflare Workers — integração Vitest"
[12]: https://developers.cloudflare.com/workers/testing/vitest-integration/mock-outbound-requests/ "Cloudflare Workers — mocking de requests"
