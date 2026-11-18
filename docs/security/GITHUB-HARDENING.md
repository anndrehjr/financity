# Proteção do repositório no GitHub

## Já incluído no código (entra em vigor após o merge)
| Arquivo | Função |
|---|---|
| `scripts/verificar-segredos.mjs` | Verificador sem dependências (`--staged`, `--tudo`, `--historico`); saída mascarada; exceção só linha a linha com motivo; lista de aceitos do histórico em `scripts/verificar-segredos.baseline.json` |
| `.githooks/pre-commit` | Barra commits com segredo/dado pessoal. Ativar uma vez por clone: `git config core.hooksPath .githooks` |
| `.gitleaks.toml` | Regras padrão do Gitleaks + **uma** exceção estreita (credenciais públicas de desenvolvimento local). Sem segredos |
| `.github/workflows/seguranca.yml` | A cada PR, push na `main` e semanalmente: verificador (arquivos e histórico completo), Gitleaks e `npm audit` (produção falha em alta/crítica). Permissões só de leitura; ações fixadas por SHA |
| `.github/workflows/ci.yml` | Tipos, testes (API com PostgreSQL de serviço) e build do site |
| `.github/dependabot.yml` | Atualizações semanais de npm, GitHub Actions e Docker |
| `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS` | Lista de verificação de segurança e revisor padrão |
| `SECURITY.md` | Como reportar vulnerabilidades de forma privada |
| `.gitignore`, `.dockerignore` | Impedem segredos, dumps, chaves e credenciais de entrarem no repositório e nas imagens |

> Os fluxos foram executados no PR #26 e na `main`: **Segredos e dados pessoais**, **Vulnerabilidades de dependências** e **testes** passaram. O Gitleaks apontou 1 falso positivo (valor propositalmente errado em um teste), avaliado e registrado em `.gitleaksignore` por impressão digital, sem exceção global.

## Configurações do GitHub (aplicadas em 2026-11-18, via `gh`)
| Configuração | Estado |
|---|---|
| Secret Scanning | ✅ ativado |
| Push Protection | ✅ ativado |
| Alertas de vulnerabilidade e atualizações de segurança do Dependabot | ✅ ativados |
| Permissões padrão dos fluxos | ✅ somente leitura; Actions não aprova PRs |
| Proteção da `main` | ✅ exige PR e as verificações *Segredos e dados pessoais*, *Vulnerabilidades de dependências* e *testes*; sem force-push e sem exclusão; o proprietário (admin) não fica bloqueado |
| Visibilidade | ⏳ **pública**; decisão pendente (ver `REMEDIATION-PLAN.md`) |

Estado observado antes: repositório público, recursos acima desativados, 26 branches remotas, sem fluxos de Actions, sem deploy keys nem webhooks e um único colaborador.

Comandos usados (referência para reaplicar em outro repositório):

```bash
gh api -X PATCH repos/<dono>/<repo> \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' \
  -f 'security_and_analysis[dependabot_security_updates][status]=enabled'
gh api -X PUT repos/<dono>/<repo>/vulnerability-alerts
gh api -X PUT repos/<dono>/<repo>/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
gh api -X PUT repos/<dono>/<repo>/branches/main/protection --input protecao.json   # exige PR + verificações; sem force-push/exclusão
```

## Limpeza de branches
Branches já fundidas (`docs/*`, `feat/*`, `fix/*`) podem ser removidas depois de confirmadas no `main`: reduz a superfície do histórico e a chance de reintroduzir conteúdo antigo.

## Observação sobre a visibilidade
Se o repositório for tornado privado (F-01): no plano gratuito, a proteção de branch e o Secret Scanning **deixam de estar disponíveis** (exigem plano pago ou GitHub Advanced Security). Mantenha `SECURITY.md`, o hook e os fluxos: o verificador do projeto e o Gitleaks da CI passam a ser a principal barreira.
