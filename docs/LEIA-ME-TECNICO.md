# FINANCITY — A jornada das decisões financeiras

Jogo educacional de Educação Financeira (8º ano). Etapa 1: **Mapa 1 — Consumo Consciente** completo, contas de aluno/professor e painel do professor. Mapas 2, 3 e 4 aparecem bloqueados ("Em desenvolvimento").

## Como rodar

```bash
npm install
npm run create-teacher -- professor "Seu Nome"   # gera senha forte em data/credenciais-professor.txt
npm run build && npm start                        # http://localhost:3000
# desenvolvimento: npm run dev
```

1. Entre em `/` com o usuário/senha do professor → painel.
2. **Alunos** → cadastre (individual, lista ou CSV `Nome;Turma`) → baixe as credenciais (PIN aparece só uma vez).
3. Troque a senha e apague `data/credenciais-professor.txt`. Preencha o nome da escola em **Configurações**.

## Stack
Next.js 15 (App Router) · React · TypeScript · Tailwind · Recharts · SQLite (`better-sqlite3`) · bcrypt.
O ambiente de desenvolvimento não tinha PostgreSQL; todo acesso ao banco está em `src/lib/db.ts`, o que facilita migrar para PostgreSQL/Prisma em produção.

## Segurança (o que existe)
- PIN/senha com **bcrypt**; PINs únicos entre alunos (impressão HMAC com segredo do servidor).
- Sessão por cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` em produção), token guardado só como hash.
- Limite de tentativas de login (5 falhas/15 min por IP+usuário; 40 por IP).
- Verificação de papel no servidor em toda rota `/api/admin/*`; aluno só acessa os próprios dados.
- Pontuação e gabarito **só no servidor**: a API do aluno nunca envia pontos nem justificativas; alternativas embaralhadas por tentativa.
- Origem verificada em requisições que alteram dados (anti-CSRF), cabeçalhos de segurança, exportação CSV protegida contra injeção de fórmulas.

## Antes de usar com alunos (produção)
- **HTTPS é obrigatório**: publique atrás de um proxy com certificado (Caddy, Nginx, Cloudflare etc.). O app já envia HSTS e cookie `Secure` em produção, mas não termina TLS sozinho.
- Faça backup periódico de `data/financity.db` (e `data/secret.key`; sem ele os PINs continuam válidos, mas a verificação de PIN repetido é recalculada com novo segredo).
- Defina `FINANCITY_SECRET` no ambiente em vez de depender de `data/secret.key`.
- Se atrás de proxy, garanta que ele repasse `X-Forwarded-For` e `X-Forwarded-Host` (limite de tentativas e verificação de origem).
- `npm audit` aponta um alerta no PostCSS embutido no Next (afeta a compilação de CSS, não o servidor em execução).

## Gerador Automático de PINs
Em **Alunos → GERAR SENHAS AUTOMATICAMENTE**: (1) alunos sem PIN, (2) alunos selecionados, (3) todos os alunos de uma turma. Nada muda antes da confirmação; redefinições avisam que os PINs antigos deixam de funcionar e encerram as sessões abertas dos alunos. PINs: 6 dígitos via `crypto.randomInt`, sem repetição no lote nem padrões óbvios, guardados só como hash. Aparecem uma única vez (tabela temporária, copiar, CSV, ficha impressa por aluno). Alunos de demonstração e contas de professor nunca são afetados. Cada operação fica no histórico administrativo (sem o PIN). "Sem PIN" = cadastro feito com a opção *Cadastrar sem PIN* (marcador interno; não há mudança de estrutura no banco).

## Dados de demonstração
Painel → "Gerar dados de demonstração": cria 24 alunos fictícios (marcados `DEMO`), **ocultos por padrão**; só aparecem escolhendo "Somente demonstração" ou "Reais + demonstração" no filtro. Podem ser removidos com um clique.

## PDF
Os relatórios usam a impressão do navegador ("Salvar como PDF"), com cabeçalho (escola, professor, data) e layout próprio para impressão. CSV é gerado pelo servidor.

## Teste automatizado
Com um servidor de teste em banco isolado (`DATABASE_PATH` separado) e `npm run create-teacher` nele:
`BASE=http://localhost:3100 TEACHER_FILE=<caminho>/credenciais-professor.txt npm run test:e2e` (47 verificações).

## Expansão dos Mapas 2–4
Tabela `maps` (campo `status`: `developing`/`available`) + `questions`/`options`. A lógica de desbloqueio sequencial já existe (`mapUnlocked` em `src/lib/game.ts`): um mapa só abre se estiver `available` **e** o anterior estiver concluído. Para publicar um mapa, insira suas perguntas e mude o status.
