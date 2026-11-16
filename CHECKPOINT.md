# Financity — ponto de retomada (2026-11-16)

Sem senhas, PINs ou chaves neste arquivo.

## Estado
- App local em `D:\Projetos Serios\Jogos Novos\financity` (Next.js 15, TypeScript, Tailwind, Recharts, SQLite). Banco: `data/financity.db`.
- Mapa 1 completo; mapas 2–4 bloqueados. Painel do professor, relatórios, ranking, cadastro, **Gerador Automático de PINs** prontos.
- Banco real: 1 professor, 19 alunos (Andre + 18 do 8º ano cadastrados), 1 tentativa concluída. Backup antes do cadastro: `data/backup-antes-cadastro-20261115-230931.db`.
- Testes: `npm run test:e2e` (77 verificações, rodam só em banco de teste isolado) + auditoria visual/acessibilidade (axe: 0 violações).
- Auditoria pedagógica entregue (somente análise): recomendação **D — reconstruir as 5 questões** (pistas de tamanho e do "sem", chute = 56%, "pegar a mais longa" = 22/25). Nada de questões/pontuação foi alterado; aguarda aprovação do professor.

## Pendências (ação do André)
1. **Reiniciar o servidor local** para pegar o build final: parar (Ctrl+C), `npm run build`, `npm start`.
2. Trocar a senha do professor em Configurações e apagar `data/credenciais-professor.txt`.
3. Decidir sobre as questões do Mapa 1 (propor 1 questão-modelo antes de refazer as 5).
4. VPS: aprovar o plano abaixo.

## VPS (144.217.161.241, SSH porta 2222, usuário sombra, chave `~/.ssh/id_ed25519_vps`) — SOMENTE LEITURA até agora
- Padrão: `~/docker/<app>`, compose, Postgres 16 por app, Nginx Proxy Manager (80/443; admin só em 127.0.0.1:81), ufw + fail2ban, backup da escola às 02:15 UTC com envio ao Google Drive (funcionando).
- Recursos: 4 vCPU, ~3 GB RAM livres, sem swap, 21 GB de disco livres. Portas livres: 3003, 3007, 3008, 3010.
- **Nenhuma alteração foi feita na VPS.** Não mexer em outros projetos.
- Plano proposto (aguardando "sim"): `~/docker/financity` (Git), Dockerfile `node:22-bookworm-slim` multi-stage, compose na rede `proxy` sem porta no host, `cap_drop ALL`, limite ~384 MB, `/api/health` (criar), volume `data/`, `.env.production` 600, host no NPM com Let's Encrypt (ex.: `financity.andre-aguiar-jr.com.br`, DNS por conta do André), backup SQLite `.backup` + sha256 + rclone (copiando `escola-backup.sh`), doc operacional. Banco: SQLite agora; PostgreSQL só se multi-escola.
- Perguntas em aberto: criar `~/docker/financity`? subdomínio? SQLite ou Postgres? compilar na VPS (fora do horário, memória limitada) ou fora?
- Avisos na VPS: possível cópia de chave privada em `~/:USERPROFILE.sshid_ed25519_vps` (root, não aberta) — conferir/apagar; `sudo` sem senha; arquivos `escola_*.sql.gz` de root sem origem identificada.

## Como retomar
Abra o terminal em `C:\Users\AndreJr` e rode `claude --continue` (última conversa) ou `claude --resume` (escolher). Ou comece nova sessão em `D:\Projetos Serios\Jogos Novos\financity` e peça: "leia CHECKPOINT.md e continue".
