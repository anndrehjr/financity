# Revisão de privacidade e dados educacionais

Os usuários são, em sua maioria, **crianças e adolescentes**. Este documento mapeia os dados tratados e os controles existentes. **Não é parecer jurídico**: a base legal, o consentimento e a política institucional devem ser validados pela escola/controlador com assessoria adequada.

## 1. Dados tratados
| Dado | Titular | Onde | Observação |
|---|---|---|---|
| Nome completo, turma, série | Aluno | `students`, `classes` | Único dado de identificação pessoal pedido ao aluno |
| Usuário e PIN | Aluno | `students` | PIN de 6 dígitos guardado só como **hash bcrypt** e uma impressão HMAC (para impedir PIN repetido); o PIN em claro existe apenas no cartão impresso na entrega |
| Respostas, pontos, tentativas, progresso | Aluno | `attempts`, `answers` | Gabarito e pontuação não são enviados ao aluno |
| Horários de entrada/saída e sinal de presença | Aluno | `presence` | Só horários; sem localização, dispositivo ou conteúdo |
| Sessão | Aluno/Professor | `sessions` | Apenas o **hash** do token; expira (8 h aluno, 4 h professor) |
| Tentativas de login | Ambos | `login_attempts` | Contém IP/usuário; **agora apagado após 24 h** (correção desta auditoria) |
| Usuário, nome, hash da senha | Professor | `teachers` | Senha em bcrypt (custo 12); política de 12+ caracteres com mistura |
| Ações administrativas | Professor/Aluno | `admin_log` | Registra ação e referência ao aluno; sem senhas |
| Voz da Nina | – | Arquivos de áudio estáticos | Gravações próprias; o site **não** chama serviço externo de voz nem envia credenciais ao navegador |

Não são coletados: CPF, e-mail, telefone, endereço, fotos, localização, dados financeiros reais.

## 2. Quem pode ler e alterar
- **Aluno:** só o próprio progresso (todas as consultas são amarradas ao seu identificador de sessão). Verificado por teste: não acessa rotas de professor (403) nem dado de colega.
- **Professor:** só alunos e turmas **vinculados a ele** (404 para os de outro professor, inclusive em relatórios, exportação, presença, PINs e exclusão). Verificado por testes.
- **Visitante:** nada (401/redirecionamento). Não há relatórios públicos nem páginas indexáveis com dados de alunos.
- **Servidor/infraestrutura:** o banco não publica porta; só a API o acessa; a API só responde ao gateway assinado.

## 3. Transmissão e armazenamento
HTTPS em todo o caminho (HSTS); chamadas do site à API assinadas (HMAC) com janela de validade; cookie de sessão nunca acessível por JavaScript. Backup diário com permissão restrita (`700`/`600`) e soma de verificação; retenção local de 30 dias; **sem cópia externa configurada** (ver F-12).

## 4. Logs
O log da API registra método, caminho, status e duração; **sem corpo, query string, cookies ou nomes**. Erros devolvem mensagens genéricas. Foi verificado que erros não expõem senhas, tokens, strings de conexão ou rastros internos.

## 5. Retenção e direitos dos titulares
- **Existe** exclusão definitiva de aluno (cadastro, tentativas, respostas, sessões, histórico e presença), com confirmação explícita e teste automatizado.
- **Não existe** política de retenção formal: dados de alunos permanecem até exclusão manual. 🗓️ Recomendado definir prazo (ex.: ao fim do ano letivo ou conforme a escola) e registrar o procedimento.
- **Não existe** fluxo documentado para atender pedidos de titulares/responsáveis (acesso, correção, eliminação). 🗓️ Recomendado documentar quem atende e em quanto tempo.
- Backups contêm dados de alunos pelo prazo de retenção do backup (30 dias); uma exclusão só desaparece dos backups após esse prazo.

## 6. Risco de reidentificação por relatórios
Relatórios, ranking e exportações exigem login de professor e respeitam o vínculo com a turma. Dados de **demonstração** são sintéticos e ficam ocultos por padrão. Ambientes de desenvolvimento e teste usam **somente contas fictícias**; listas reais de alunos ficam **fora do repositório** (e o `.gitignore` bloqueia credenciais e planilhas).

## 7. Pontos de atenção (LGPD, menores de idade)
- O tratamento de dados de crianças e adolescentes deve observar o melhor interesse do titular (LGPD, art. 14). Registrar a base legal e a autorização da escola/responsáveis. Consulte as orientações da ANPD.
- Registrar o inventário de dados e o responsável (controlador/operador) e manter um canal de contato para titulares.
- Planejar o procedimento de **incidente de segurança** (quem avisa quem, e quando), incluindo comunicação à ANPD e aos titulares quando aplicável.
- Antes de manter o repositório público, confirmar que não há conteúdo de terceiros sem permissão de uso (F-14).
