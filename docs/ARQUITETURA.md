# Financity — arquitetura (versão PostgreSQL, branch `feat/postgres-api`)

```
Navegador ──HTTPS──▶ https://jogos.<domínio>            (Vercel: apps/web — telas e jogos)
                       │  o navegador só fala com este site; /api/* é um gateway
                       │  o gateway confere a origem, assina a chamada (HMAC) e repassa
                       ▼ HTTPS
                     https://api.<domínio>               (VPS: Nginx Proxy Manager → container financity-api)
                       │  rede Docker interna, sem porta publicada no host
                       ▼
                     PostgreSQL 16 (container financity-db) — nenhuma porta exposta; só a API o enxerga
```

`<domínio>` ainda **não foi definido**. Nenhum DNS, certificado ou compra foi feito.

## Componentes
| Pasta | Função | Onde roda |
|---|---|---|
| `apps/web` | Telas, jogos, painel do professor (Next.js). Contém o gateway `/api/[...path]` e lê a sessão no servidor. **Não tem acesso ao banco nem credenciais dele.** | Vercel |
| `apps/api` | API (Hono + `pg`): login, sessões, regras de avaliação, pontuação, relatórios, autorização por professor/turma/série. | VPS (Docker) |
| `packages/gateway-sign` | Assinatura/verificação HMAC das chamadas Vercel → API. | os dois |
| `deploy/` | Dockerfile, compose, ensaio (staging), backup e restauração. | VPS |

## Segurança (como cada requisito é atendido)
1. **Navegador/Vercel nunca acessam o banco**: só a API tem `DATABASE_URL`; o web só conhece `API_URL` e `GATEWAY_SECRET` (variáveis de servidor, sem `NEXT_PUBLIC_`).
2. **Porta do banco**: o compose não publica `5432`; o banco está numa rede Docker `internal` que só a API usa.
3. **API fechada**: toda chamada `/api/*` exige assinatura HMAC-SHA256 (método, caminho+query, IP do cliente, hash do corpo, hora). Janela de 60 s, anti-repetição, comparação em tempo constante. Chamada direta sem assinatura → 401. `/healthz` é o único endpoint público e não expõe dados.
4. **Não depende de IP fixo da Vercel** (add-on pago: US$ 100/mês por projeto, só Pro/Enterprise). A proteção é o segredo + assinatura; CORS não é usado como proteção.
5. **Autorização no servidor**: perfis `student`/`teacher`; professor só alcança turmas vinculadas em `teacher_classes`; aluno só enxerga avaliações da série da sua turma. Identificadores vêm da sessão/banco, nunca do corpo da requisição. IDs inválidos → 404.
6. **Respostas corretas e pontos ficam no servidor** (nunca são enviados ao aluno; há teste de vazamento).
7. **Abuso**: limite de login por IP+usuário, por IP e por usuário (PostgreSQL), corpo máx. 1 MB, validação com `zod`, mensagens de erro genéricas, logs só com método/caminho/status/tempo (sem corpo, query, cookie, nome ou PIN).
8. **Sessões**: cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção; token opaco, guardado com hash no banco.

## Modelo de dados (migrações em `apps/api/migrations`)
- `001_base.sql`: equivalente ao SQLite atual (permite importar com os mesmos IDs).
- `002_series_avaliacoes.sql` (aditiva): `classes.grade`, `subjects`, `maps.subject_id/kind`, `assessments` (mapa/jogo atribuído a uma **série**, com ordem e situação), `attempts.assessment_id`, `teacher_classes`.
- Séries atuais: 8º ano. Para criar o 7º ano: inserir `assessments` com `grade=7` apontando para os mapas/questões do 7º. Matérias e jogos novos entram em `subjects`/`maps(kind)`.
- A série da turma é deduzida do nome ("8º A", "7 ano"…); turma nova sem número é recusada.

## Banco: SQLite × PostgreSQL
A migração para PostgreSQL 16 foi decisão do projeto (esta versão). Justificativas e efeitos: várias instâncias/serviços e crescimento (séries, matérias, jogos), transações com trava de linha (respostas simultâneas), backups lógicos (`pg_dump`) e restauração testável. Ordenação alfabética usa a *collation* do banco (`en_US.utf8` no Docker); o SQLite ordenava por bytes.

## Limitações conhecidas
- Telas ainda mostram um único jogo (`/jogo/mapa-1`) e o painel usa a primeira avaliação da série; seletor de avaliação/série na interface é a próxima etapa (a API já aceita `?assessment=` e `?class=`).
- O conteúdo do 7º ano (questões/avaliações) ainda não existe; aluno de turma do 7º entra, mas não vê atividades.
- Pontuações editadas pelo professor valem para todos que usam aquela questão (um único professor hoje).
- `settings` (nome da escola/professor) é global, não por professor.
