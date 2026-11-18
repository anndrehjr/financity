# Inventário de exposições (sanitizado)

Evidências sempre mascaradas: caminho, tipo e tamanho. Nenhum valor sensível é reproduzido.
Abrangência: árvore atual (246 arquivos versionados) e histórico completo (80 commits, 26 branches remotas, 1 tag).

## Resumo
| Categoria | Atual | Histórico | Situação |
|---|:-:|:-:|---|
| Chaves privadas, tokens (GitHub, AWS, Slack), chaves de serviços (ElevenLabs etc.) | 0 | 0 | Nada encontrado |
| JWT/segredos reais em código ou config | 0 | 0 | Nada encontrado |
| Senhas reais em strings de conexão | 0 | 0 | Só a credencial de **desenvolvimento local** (abaixo) |
| Arquivos `.env` reais, dumps, bancos (`.db`, `.sqlite`), chaves (`.pem`, `.key`), planilhas, listas/cartões de credenciais | 0 | 0 | Nunca versionados (só `data/.gitkeep`) |
| CPF, telefones, e-mails reais | 0 | 0 | E-mails dos commits são anônimos (`noreply`/`.local`) |
| Nomes reais de alunos ou professores | 0 | 0 | Só personagens fictícios (ex.: "Ana Maria") |
| Informações operacionais internas em documentos | 0 (corrigido) | 1 commit | Baixa; ver F-07 |

## Itens avaliados
| # | Caminho (resumo) | Tipo | Gravidade | Evidência (mascarada) | Atual? | Histórico? | Conclusão / ação |
|---|---|---|---|---|:-:|:-:|---|
| 1 | 13 arquivos de API, testes e scripts de dev | Credencial de banco de **desenvolvimento local** (`127.0.0.1`, porta de teste) | Baixa | `usuário:<14 caracteres>@127.0.0.1` | Sim | Sim | Pública e sem acesso a nada além do banco de teste embutido. Mantida e documentada; liberada no Gitleaks apenas por esse valor |
| 2 | `apps/api/test/security.test.ts` (1 linha) | Valor propositalmente **errado** em teste ("segredo errado → 401") | Info | literal de 48 caracteres | Sim | Sim | Falso positivo; marcado na própria linha com o motivo |
| 3 | `testar-local.ps1` (1 linha) | Frase fixa de teste local (cenário SQLite antigo) | Info | literal de 48 caracteres, só minúsculas e hífens | Sim | Sim | Falso positivo; marcado na própria linha. Se esse valor algum dia coincidiu com um segredo real, rotacione |
| 4 | 9 documentos e scripts | Host da API, usuário/porta de SSH, caminhos da máquina do mantenedor | Baixa | texto de documentação | Corrigido | 1 commit antigo (`CHECKPOINT.md`) | Atual: trocado por marcadores. Histórico: sem credenciais; não justifica reescrever histórico |
| 5 | `docs/relatorios/*.json` | Relatórios de migração/backup | Info | só contagens e verificações | Sim | Sim | Sem dados pessoais |
| 6 | `tools/alunos/credenciais*.ts` | Código que **gera** cartões de credenciais | Info | código | Sim | Sim | É código, não dado. As saídas (CSV/HTML/TXT) ficam fora do repositório e agora também no `.gitignore` |
| 7 | `docs/conteudo/*` | Banco de questões educacionais | Info | texto pedagógico | Sim | Sim | Sem dados pessoais; ver F-14 (direitos autorais de parte do conteúdo) |
| 8 | Visibilidade do repositório | Governança | Média | `public` | Sim | – | F-01: decisão do proprietário |

## Metodologia de varredura
1. Varredura por padrões (chaves privadas, tokens conhecidos, conexões com senha, JWT, segredos literais, hex longo, CPF, telefone, e-mail) em todos os arquivos versionados e em **todas as linhas adicionadas** de todos os commits, de todas as refs.
2. Inventário de **nomes de arquivos** já versionados em qualquer momento (inclusive removidos).
3. Verificação de arquivos ignorados pelo Git no disco (só nomes; conteúdo nunca copiado).
4. Reexecução com o verificador do projeto (`scripts/verificar-segredos.mjs`), que passou a fazer parte do pre-commit e da CI.

## Observação sobre segredos já publicados
Nenhum segredo real foi localizado. Mesmo assim: qualquer valor que algum dia tenha sido publicado deve ser tratado como potencialmente comprometido, mesmo depois de removido do arquivo atual. Se um caso real surgir, o plano de resposta está em `REMEDIATION-PLAN.md`.
