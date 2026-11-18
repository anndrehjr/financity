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

> Os fluxos **ainda não foram executados** (exigem o envio ao GitHub). Ao abrir o primeiro PR, confira que os dois ficam verdes; ajustes de ambiente do `ci.yml` podem ser necessários.

## Configurações do GitHub que dependem de ação do proprietário (não executadas)
Estado observado em 2026-11-18: repositório **público**; Secret Scanning, Push Protection e atualizações de segurança do Dependabot **desativados**; 26 branches remotas (várias já fundidas); sem fluxos de Actions; sem deploy keys nem webhooks; um único colaborador (o proprietário).

Em repositório público estes recursos são gratuitos. Com a CLI `gh` (como proprietário):

```bash
# 1) Secret Scanning + Push Protection + Dependabot (alertas e atualizações de segurança)
gh api -X PATCH repos/<dono>/<repo> \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' \
  -f 'security_and_analysis[dependabot_security_updates][status]=enabled'
gh api -X PUT repos/<dono>/<repo>/vulnerability-alerts

# 2) Permissões padrão dos fluxos: somente leitura
gh api -X PUT repos/<dono>/<repo>/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false

# 3) Proteger a main: exigir PR, verificações verdes e histórico linear; sem force-push nem exclusão
gh api -X PUT repos/<dono>/<repo>/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["Segredos e dados pessoais", "Vulnerabilidades de dependências", "testes"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": true },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```
Ajuste os nomes em `contexts` aos nomes reais dos jobs após a primeira execução. Com um único mantenedor, `required_approving_review_count: 0` evita travar o fluxo, mas ainda exige PR e verificações.

## Limpeza de branches
Branches já fundidas (`docs/*`, `feat/*`, `fix/*`) podem ser removidas depois de confirmadas no `main`: reduz a superfície do histórico e a chance de reintroduzir conteúdo antigo.

## Observação sobre a visibilidade
Se o repositório for tornado privado (F-01), mantenha `SECURITY.md` e os fluxos; o Secret Scanning de repositório privado exige GitHub Advanced Security, então o verificador do projeto e o Gitleaks da CI passam a ser a principal barreira.
