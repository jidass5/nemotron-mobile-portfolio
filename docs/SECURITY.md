# Segurança

## Controles implementados

- apenas `http` e `https`;
- bloqueio de credenciais embutidas na URL;
- somente portas 80 e 443;
- bloqueio de loopback, localhost, faixas privadas/reservadas IPv4 e IPv6 literal;
- redirects manuais, com validação de cada destino;
- máximo de cinco redirects;
- timeout de upstream;
- limite de leitura de 2 MB;
- rejeição de conteúdo binário;
- rate limit em memória;
- CORS configurável por `ALLOWED_ORIGINS`;
- allowlist opcional de destinos por `ALLOWED_HOSTS`, reaplicada em cada redirect;
- `Cache-Control: no-store` e `X-Content-Type-Options: nosniff` nas respostas;
- nenhum segredo necessário para executar os testes.

## Limitações conhecidas

O Worker não faz resolução DNS própria para detectar um hostname público que
resolva para IP privado. O bloqueio conservador de hostnames e a execução na
borda reduzem o risco, mas não substituem um firewall/egress controlado em um
ambiente de produção.

O rate limit é por isolate. Para limite global, usar binding de Rate Limiting,
Durable Object ou outro armazenamento distribuído.

Conteúdo recuperado de páginas externas é **dado não confiável**. O cliente que
consome esse texto deve delimitá-lo como conteúdo externo e não tratá-lo como
instrução do sistema ou autorização para executar ações.

## Checklist antes de produção

- restringir `ALLOWED_ORIGINS`;
- definir `ALLOWED_HOSTS` para o conjunto mínimo de destinos necessários;
- adicionar observabilidade sem registrar URLs sensíveis ou conteúdo privado;
- configurar limite global de requisições;
- validar e limitar redirects e tipos de conteúdo também no cliente;
- usar um backend/OAuth para tokens GitHub, em vez de guardar tokens no WebView;
- trocar commit direto por branch + Pull Request;
- revisar dependências com `npm audit` e atualizar versões de forma controlada.
