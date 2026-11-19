# Antitrapaça e integridade das partidas

Sistema de **integridade das partidas** do Financity: registra ocorrências, aplica penalidades progressivas e configuráveis, protege o conteúdo
na medida do que um navegador permite e dá ao professor uma tela para analisar, decidir e auditar. Tudo é decidido no **servidor (API)**; o
navegador apenas *relata* o que os componentes do próprio Financity conseguiram observar.

> **Princípio:** nenhum alerta acusa o aluno. Só se afirma o que foi **observado**. "Atalho pressionado" nunca vira "captura realizada";
> perder o foco nunca vira "uso de IA". Eventos que não comprovam trapaça **jamais** geram desconto de pontos.

## 1. O que NÃO é evento (permitido, sem penalidade)

Minimizar o navegador, bloquear a tela, receber notificação, atender ligação, trocar de aba ou de aplicativo e voltar, perder a conexão.
Esses eventos de ciclo de vida (`visibilitychange`, `pagehide`, `blur`, `offline`…) **não são enviados ao servidor** nem gravados. A única
consequência é local: o relógio de "parado" da Nina fica pausado enquanto a página está oculta (`usePaginaVisivel`). A partida não reinicia: o
estado (pergunta atual, respostas, pontos) está no servidor e é restaurado ao voltar ou atualizar a página.

## 2. Níveis, eventos e consequências

| Nível | Quando | Consequência padrão |
|---|---|---|
| 0 — permitido | minimizar, bloquear tela, trocar de aba/app | nenhuma; nada é registrado |
| 1 — atividade incomum | atalho de impressão pressionado; tecla de captura de tela pressionada; **indicadores do servidor** (abaixo) | alerta no painel; aviso neutro ao aluno (só nos eventos do navegador); **sem pausa, sem desconto** |
| 2 — violação detectada | impressão da página iniciada (`beforeprint`); tentativa de copiar/recortar o conteúdo da questão | partida suspensa por `suspendSeconds` (padrão 20 s), mensagem com o motivo exato, registro e advertência |
| 3 — reincidência | a *N*-ésima violação de nível 2 na mesma partida, desde a última liberação (`blockAfter`, padrão 3) | partida **bloqueada**: só volta com a liberação do professor |

- A gravidade de cada evento do navegador é configurável (nível 1 ou 2). O nível 3 só nasce da reincidência; o navegador nunca escolhe gravidade.
- Ocorrências **justificadas** pelo professor não contam para a reincidência. Depois de uma liberação, a contagem recomeça.
- **Desconto de pontos** (`deductPoints`, padrão **0 = desligado**): se ligado, vale só para violações **detectadas** (níveis 2 e 3), nunca para
  indicadores. É registrado por ocorrência (`points_deducted`), reversível (cancelar a penalidade ou justificar devolve os pontos) e auditado.
- Dedupe: o mesmo evento repetido em menos de 3 s é registrado uma vez; no máximo 30 relatos por aluno em 10 min.

### Indicadores calculados no servidor (revisão, não acusação)
Sempre nível 1, `certainty = indicator`, sem penalidade:
- `resposta_muito_rapida` — resposta enviada antes do tempo mínimo plausível de leitura (0,12 s por palavra do enunciado, entre 2 e 8 s), medido do
  momento em que a pergunta foi entregue (atualizar a página **não** zera esse relógio);
- `sequencia_respostas_rapidas` — 3 ou mais respostas rápidas na mesma partida;
- `padrao_posicao_repetido` — 5 respostas de escolha única seguidas na mesma posição da tela;
- `requisicoes_anormais` — mais de 8 envios de resposta em 10 s (`ANSWER_FLOOD_MAX`); o excesso recebe HTTP 429;
- `sessoes_simultaneas` — outra sessão do mesmo aluno ativa (sinal de vida nos últimos 2 min) durante uma resposta.
  Opcional: **sessão única** (`singleSession`, padrão desligado) encerra as sessões anteriores no login.

## 3. Proteção do conteúdo (lado do aluno)

Ativa só durante a partida em andamento e só se estiver ligada na tela *Segurança* (cada item é independente):
- **Impressão:** `Ctrl/Cmd+P` é interceptado (registra "atalho pressionado"); se a impressão for iniciada por outro caminho (`beforeprint`), a
  página imprime **apenas uma folha com aviso** (`@media print` esconde todo o conteúdo) e a ocorrência é registrada.
- **Cópia:** o texto da questão tem `user-select: none` (e sem *touch callout* no celular). Leitores de tela não são afetados (CSS não altera a
  árvore de acessibilidade). Se alguém contorna o CSS e consegue selecionar, o evento `copy`/`cut` sobre o conteúdo protegido é bloqueado e relatado.
  Copiar texto de **fora** do conteúdo protegido, ou sem texto selecionado, não gera nada.
- **Captura de tela:** `PrintScreen` (só visível no `keyup`), `Cmd+Shift+3/4/5` e `Win+Shift+S` são registrados como **"tecla pressionada"**,
  nível 1, com a frase *"isto não confirma que a captura ocorreu"*. Nada é bloqueado (não há como).
- **Marca d'água** (padrão desligada): nome do aluno, referência da sessão (8 caracteres do hash, **não** é o token) e data/hora, repetidos na
  diagonal, ~10 % de opacidade, `pointer-events: none`, `aria-hidden`, escondida na impressão.
- **Sobreposição de proteção** (`role="alertdialog"`): título, motivo exato (texto montado a partir do evento realmente observado), consequência
  e botão **Entendi** (habilitado ao fim da suspensão) ou **Verificar novamente** (bloqueio). Cobre inclusive a Nina (z-index 20000). Persiste
  após F5, pois o estado vem do servidor.

## 4. Painel do professor — *Segurança e Antitrapaça* (`/admin/seguranca`)

- Indicadores: alunos com ocorrências, alertas pendentes, violações confirmadas, partidas bloqueadas/suspensas agora, penalidades aplicadas, reincidentes.
- "Partidas aguardando você": lista das partidas travadas com botão **Liberar partida**.
- Histórico com filtros por turma, série, aluno, data, gravidade, situação e tipo (detectado × indicador). Cada linha: aluno, turma, partida,
  data/hora, aparelho (classe grosseira: "celular · Android · Chrome"), evento, gravidade, penalidade, situação e nº de ocorrências do aluno.
- Detalhe: evidências, outras ocorrências do aluno, estado atual da partida e ações **Confirmar violação**, **Marcar como justificada**,
  **Cancelar penalidade**, **Liberar partida**. Justificar/cancelar/liberar exigem motivo (≥ 3 caracteres).
- **Regras e penalidades** configuráveis (tabela `settings`, chave `integrity_config`) e **Auditoria**: toda decisão e toda mudança de regra gera
  um registro em `integrity_audit` (quem, quando, o quê, motivo). A API não tem rota para editar ou apagar a auditoria.

## 5. Backend

### Banco (migração aditiva `007_integridade.sql`)
- `integrity_events` — `id, student_id, session_ref, assessment_id, attempt_id, event_type, severity (1–3), certainty (detected|indicator),
  source (client|server), evidence (jsonb), device, detected_at, penalty (none|warning|suspension|block), points_deducted,
  penalty_cancelled_at, status (pending|confirmed|justified), reviewed_by, reviewed_at`.
- `integrity_audit` — trilha de decisões.
- `attempts` ganhou `integrity_status/_until/_event_id/_released_at` e `served_question_id/served_at` (valores padrão; nada existente muda).
- **Reversão:** `DROP TABLE integrity_audit, integrity_events;` e remover as colunas acima de `attempts`. As pontuações não são tocadas pela migração.

### Rotas
Aluno: `GET /api/integrity/config` (só o que o navegador precisa), `POST /api/game/:id/integrity/event`. Não existe rota de leitura, edição ou
exclusão de ocorrências para o aluno. Professor (`requireRole("teacher")`, só alunos das suas turmas): `GET /api/admin/integrity/{summary,events,events/:id,audit,config}`,
`PATCH /api/admin/integrity/events/:id` (`confirm|justify|cancel_penalty`), `POST /api/admin/integrity/attempts/:id/release`, `PUT /api/admin/integrity/config`.

### Integridade do jogo (já existia e foi preservado/testado)
Respostas corretas e pontos por alternativa **nunca** saem da API; o servidor calcula a pontuação (campos como `points`/`score` no corpo são
ignorados); só a pergunta atual é respondível; resposta repetida → 409; respostas simultâneas são serializadas por trava de linha; o resultado
só é entregue após concluir; o conteúdo (gabarito) fica em `apps/api/src/content` e **não está em nenhum arquivo do site** (verificado nos
bundles e em `public/`). Enquanto a partida está suspensa/bloqueada, `POST .../answer` responde **423**.

## 6. Privacidade e LGPD

- **Minimização:** só tipo do evento, data/hora, aparelho em classe grosseira (sem ID único nem *fingerprint*), referência curta da sessão e, no
  máximo, o nome da tecla. Não há espionagem de abas, histórico, extensões, câmera, microfone nem conteúdo da tela.
- **Retenção:** `retentionDays` (padrão 180, 30–730). A API apaga ocorrências e auditoria expiradas ao iniciar e a cada 24 h.
- **Exclusão:** excluir o aluno apaga as ocorrências dele (`ON DELETE CASCADE`).
- **Menores:** acesso restrito ao professor responsável pela turma; recomenda-se comunicar a política (o que é e não é registrado) a alunos e
  responsáveis antes de ligar penalidades.
- **Falsificação:** o aluno pode forjar a *própria* chamada de relato (o navegador é dele), mas só consegue prejudicar a si mesmo: o tipo é de uma
  lista fixa, gravidade/penalidade são do servidor, há limite de taxa, não afeta outros alunos e todo registro passa por revisão do professor.

## 7. Limitações inevitáveis dos navegadores (leia antes de prometer algo a alguém)

1. **Captura de tela e gravação não são detectáveis nem bloqueáveis na web.** Nem no Android, nem no iPhone, nem no computador. O que existe é
   o registro de *teclas* (que o sistema pode consumir antes do navegador) e a desistência de facilitar (sem seleção/cópia, impressão em branco,
   marca d'água que identifica o vazamento). Foto da tela com outro aparelho é impossível de impedir.
2. **O navegador não vê outros sites/abas/apps.** Não dá para saber se o aluno abriu ChatGPT, Gemini, Claude ou Copilot. Perder o foco **não prova**
   nada e por isso nem é registrado. A defesa real é pedagógica e de servidor: gabarito só no servidor, tempos plausíveis, padrões e revisão humana.
3. `Ctrl+P` só é interceptado quando o navegador entrega o atalho; impressão pelo menu pode chegar só como `beforeprint` (registrado e com folha
   em branco). `PrintScreen` só aparece no `keyup`; `Win+Shift+S` e `Cmd+Shift+3/4/5` muitas vezes nem chegam à página.
4. `user-select: none` é contornável por quem controla o próprio navegador (DevTools, modo leitura, extensões). Para quem faz isso, o evento
   `copy` é a segunda barreira; mesmo assim, texto lido na tela pode ser digitado em outro lugar.
5. Relatos do navegador podem ser **suprimidos** por quem bloqueia o JavaScript/a rede da página; por isso nenhum indicador isolado é prova, e os
   indicadores do servidor (tempo, padrão, rajada, sessões) não dependem do navegador.
6. O limitador de rajada e o dedupe usam memória do processo da API (uma réplica). Com várias réplicas, os limites valem por réplica.
7. Resposta "muito rápida" tem falsos positivos (aluno que já conhecia a questão); por isso é só indicador de nível 1.

## 8. O que exigiria aplicativo nativo ou ambiente supervisionado (opcional, futuro)

- **Android (WebView/Capacitor):** `WindowManager.LayoutParams.FLAG_SECURE` na `Activity` impede capturas, gravações e a miniatura em "recentes" — é a
  única forma real de proteção contra screenshot nesse sistema. O Financity continuaria sendo o mesmo site dentro do app (opção futura; hoje **não** é obrigatório).
- **iOS (app nativo):** `UIScreen.isCaptured` e `UIApplication.userDidTakeScreenshotNotification` informam gravação e *screenshot* **depois** que
  acontecem (não impedem); `UITextField` seguro pode ocultar conteúdo em gravação.
- **Modo quiosque/prova supervisionada:** Safe Exam Browser, Chromebook gerenciado ou MDM bloqueiam troca de app e abas; ou prova em laboratório com o professor presente.

## 9. Testes

| Camada | Arquivo | Resultado |
|---|---|---|
| API (PostgreSQL real, banco `fc_integridade`) | `apps/api/test/integridade.test.ts` — 34 testes: não penalizar permitido, níveis 1/2/3, reincidência e liberação, desconto opcional e reversível, indicadores, rajada, sessões, pontuação forjada, gabarito, isolamento entre professores, aluno sem acesso ao histórico, filtros, auditoria, configuração, retenção, exclusão | 34/34 |
| API completa | `npm test -w apps/api` | 121/121 |
| Lógica do navegador | `apps/web/src/features/integridade/__tests__/deteccao.test.ts` | incluída em `npm test -w apps/web` (62/62) |
| Navegador real (Chrome, celular e desktop) | `tools/antitrapaca-e2e/` — 44 verificações | 44/44 |

O E2E exige PostgreSQL local (`npm run pg:dev`), `puppeteer-core` e o Chrome instalados (não são dependências do projeto). Veja o cabeçalho de
`tools/antitrapaca-e2e/antitrapaca.mjs`. Os testes antigos `series` e `pontuacao-padrao` passaram a montar o banco "antes da migração" por SQL
direto (o código novo do jogo exige as colunas da 007, que em produção são aplicadas antes de a API subir).

## 10. Operação

1. Fazer backup do banco (`deploy/` já tem rotina) e subir a API: a migração `007` é aplicada ao iniciar, com trava.
2. Em **Segurança → Regras e penalidades**, revise: marca d'água (padrão desligada), suspensão, bloqueio, desconto (padrão 0) e retenção.
3. Variável opcional `ANSWER_FLOOD_MAX` (padrão 8 envios/10 s por aluno).
4. Comunique aos alunos o que é monitorado e que minimizar/atender ligação não tem consequência.
