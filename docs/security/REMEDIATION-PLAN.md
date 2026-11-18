# Plano de remediação

Legenda: ✅ feito e testado localmente · ⏳ depende de autorização do proprietário · 🗓️ planejado.
Atualização: os itens ✅ foram publicados (PR #26) e implantados em 2026-11-18, com backup antes; veja a seção 2 para o que ainda depende do proprietário.

## 1. Já corrigido (local)
| ID | Ação | Verificação |
|---|---|---|
| F-02 | `Content-Security-Policy` restritivo em `apps/web/next.config.mjs` (sem origens externas; `frame-ancestors 'none'`; `object-src 'none'`; sem `unsafe-eval` em produção) | Teste automatizado + 0 violações no navegador (login, jogo com voz da Nina, 6 telas do professor) |
| F-03 | `zod` 3 → 4.6.7; limites de tamanho no cadastro em lote (500 linhas; campos limitados) | 87 testes da API passam; `npm audit` de produção: 0 |
| F-04 | `overrides` de `postcss` para ≥ 8.5.33 (copia embutida no `next`) | `npm ls` mostra tudo em 8.5.33; build ok |
| F-05 | `@hono/node-server` 1.x → 2.1.9 | Servidor real inicia; `/healthz` 200; sem assinatura 401 |
| F-07 | Documentação sem host da API, usuário/porta de SSH e caminhos locais; scripts passam a exigir esses valores (sem padrão embutido) | Busca por esses padrões: 0 ocorrências |
| F-08 | `.gitignore` reforçado (chaves, dumps, credenciais em qualquer formato de dados) e `.dockerignore` novo | `git check-ignore` confirma os padrões; nenhum arquivo versionado foi atingido |
| F-09 | Verificador de segredos (`scripts/verificar-segredos.mjs`), hook de pre-commit, `.gitleaks.toml`, fluxos `seguranca.yml` e `ci.yml`, `dependabot.yml`, modelo de PR, `CODEOWNERS`, `SECURITY.md` | Hook barrou commit com senha de banco e CPF fictícios; verificador limpo no repositório e no histórico |
| – | Minimização: tentativas de login antigas (IP) apagadas após 24 h | Teste automatizado |

## 2. Estado das ações que dependiam de autorização
| Prioridade | Ação | Estado |
|---|---|---|
| 1 | **F-01 — visibilidade do repositório** | ⏳ **Aguarda decisão.** O repositório está público. Tornar privado melhora o sigilo do código, mas no plano gratuito do GitHub **desativa** o Secret Scanning, o Push Protection e a proteção da `main` recém-ativados; o verificador do projeto e o Gitleaks da CI continuam. Se o público for intencional (ex.: portfólio), manter |
| 2 | Publicar a branch e implantar site e API | ✅ **Feito** (PR #26). Backup `financity-20261118-151953Z.dump` antes (restauração testada). API reconstruída; saúde ok; dados idênticos antes/depois; validação de entrada (zod 4) conferida de fora; CSP no ar |
| 3 | **F-09 — ativar** Secret Scanning, Push Protection, alertas e atualizações do Dependabot; proteger a `main`; permissões de fluxo somente leitura | ✅ **Feito e conferido** |
| 4 | **F-12 — cópia externa dos backups** | ⏳ Pendente (infraestrutura) |
| 5 | Remover o IP/host do histórico antigo | Não recomendado (sem credenciais; endereço público por natureza) |

## 3. Planejado (sem urgência)
- 🗓️ **F-06:** migrar `tailwindcss` 3 → 4 (remove os 10 avisos de desenvolvimento).
- 🗓️ **F-10:** igualar o tempo de resposta do login de professor ao dos demais (comparação extra de bcrypt para usuários não-professores) — custo ≈ +250 ms por login de aluno; só vale se a enumeração de professores virar preocupação.
- 🗓️ **F-11:** avaliar PIN de 8 dígitos ou verificação adicional se o risco de bloqueio de contas por terceiros se materializar.
- 🗓️ Domínio próprio para a API (hoje o host deriva do IP).
- 🗓️ Política de retenção de dados (ver `PRIVACY-REVIEW.md`).
- 🗓️ Rotação periódica de `GATEWAY_SECRET` e `FINANCITY_SECRET` (atenção: `FINANCITY_SECRET` não pode mudar sem reemitir os PINs dos alunos).

## 4. Se um segredo real for encontrado no futuro
1. **Revogar/rotacionar primeiro** (a remoção do arquivo não basta; trate como comprometido).
2. Avaliar uso indevido (logs do serviço afetado).
3. Preservar uma cópia de recuperação restrita antes de limpar.
4. Limpar o histórico com `git-filter-repo` (documentação oficial), **só com autorização**, avaliando impacto em branches, tags, clones e PRs; **nunca** `git push --force` automático.
5. Reexecutar `node scripts/verificar-segredos.mjs --historico`.
6. Avisar quem tenha clones para descartá-los. Não é possível garantir a remoção de cópias já feitas por terceiros.
