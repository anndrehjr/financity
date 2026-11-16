# Financity — ponto de retomada (2026-11-16, versão PostgreSQL)

Sem senhas, PINs ou chaves neste arquivo.

## Onde está cada coisa
- **Sistema atual (SQLite) — INTACTO**: `D:\Projetos Serios\Jogos Novos\financity` (branch `main`, tag `v0-sqlite-estavel`). É o caminho de retorno.
- **Versão nova (PostgreSQL + API na VPS + web na Vercel)**: `D:\Projetos Serios\Jogos Novos\financity-pg` (branch `feat/postgres-api`, commits locais; **nada enviado ao GitHub**).
- **Backups verificados**: `D:\Projetos Serios\Jogos Novos\financity-backups\<data-hora>\` (SQLite + código + cópia bruta; contém dados de alunos e `secret.key`).
- Documentos: `docs/ARQUITETURA.md`, `docs/OPERACAO.md`, `docs/MIGRACAO-E-ROLLBACK.md`, `docs/relatorios/*.json`.

## Concluído e verificado
- Backup do SQLite (integrity ok, restauração testada) e do código (extração idêntica).
- API Hono + PostgreSQL 16; migrações 001 (base) e 002 (séries, matérias, avaliações por série, vínculo professor↔turma).
- Gateway Next (Vercel) → API fechada por assinatura HMAC; autorização por professor/turma/série.
- Script de migração com verificação linha a linha: ensaio local e ensaio **na VPS** (pilha isolada, já removida) sem divergências.
- Testes: e2e 87/87 (pela cadeia completa) e 29/29 de segurança. Backup/restauração testados na VPS.
- VPS: ensaio descartável criado e **totalmente removido**; os 22 containers originais não foram afetados.

## Não feito (aguarda aprovação) — ver `docs/MIGRACAO-E-ROLLBACK.md` §3
- Troca definitiva, domínio/DNS/certificados, projeto na Vercel, pilha definitiva na VPS (`~/docker` é do root: precisa de `sudo`), push para GitHub.

## Pendências (ação do André)
1. Informar o domínio comprado (não foi inventado nenhum).
2. Decidir plano da Vercel (Hobby = uso pessoal/não comercial; Pro ≈ US$ 20/mês) e se o código vai para o GitHub (`anndrehjr`).
3. Trocar a senha do professor e apagar `data/credenciais-professor.txt` (a senha desse arquivo ainda confere com o banco).
4. Aprovar a reconstrução das 5 questões (trilha separada; nada foi alterado).
5. Conteúdo/avaliações do 7º ano; seletor de série/avaliação na interface (a API já suporta).

## Como retomar
`cd "D:\Projetos Serios\Jogos Novos\financity-pg"` e peça: "leia CHECKPOINT.md e docs/MIGRACAO-E-ROLLBACK.md e continue". Para testar: `npm run pg:dev` (PostgreSQL local), depois ver docs/OPERACAO.md.
