# Auditoria de segurança — Financity (2026-11-18)

Relatório **sanitizado**: nenhum segredo, token, dado pessoal ou endereço de infraestrutura aparece aqui. Valores sensíveis, quando citados, aparecem só como tipo e tamanho.

## Escopo e método
Inspeção do código (API, site, banco e migrações, scripts, Docker, GitHub Actions, documentação, ativos públicos), de **todo o histórico do Git** (80 commits, 26 branches remotas e 1 tag) e da configuração visível de fora da produção (cabeçalhos, HTTPS, portas). Testes dinâmicos só em **ambiente local isolado com contas fictícias**; na produção, apenas leituras (sem alterar dados, sem força bruta, sem testes invasivos).

Fases: A inventário · B segredos e dados sensíveis · C histórico Git · D autenticação e autorização · E API e banco · F infraestrutura e dependências · G correções e regressão · H documentação · I proteções preventivas · J relatórios.

## Resultado em números
| Gravidade | Encontrados | Corrigidos (local) | Aceitos / documentados | Dependem de autorização |
|---|:-:|:-:|:-:|:-:|
| Crítica | 0 | – | – | – |
| Alta | 0 | – | – | – |
| Média | 5 | 4 | 0 | 1 |
| Baixa | 7 | 3 | 3 | 1 |
| Informativa | 2 | – | 2 | – |
| **Total** | **14** | **7** | **5** | **2** |

> **Atualização (2026-11-18, após autorização do proprietário):** as correções foram publicadas (PR #26) e implantadas no site e na API, com backup verificado antes; as proteções do GitHub foram ativadas (ver `GITHUB-HARDENING.md`). Credenciais **não** foram rotacionadas (nenhum segredo real foi encontrado) e a visibilidade do repositório **não** foi alterada (aguarda decisão do proprietário).

## Achados
| ID | Gravidade | Achado | Estado |
|---|---|---|---|
| F-01 | Média | O repositório no GitHub está **público**. Não contém segredos nem dados de alunos, mas expõe código e detalhes operacionais de um sistema que atende menores. Não havia varredura de segredos nem proteção de push habilitadas | **Depende de decisão do proprietário** (trocar para privado desativa, no plano gratuito, o Secret Scanning e a proteção da `main`) |
| F-02 | Média | Site sem `Content-Security-Policy` (segunda barreira contra XSS) | Corrigido e **em produção** (CSP restritivo, 0 violações nas telas testadas) |
| F-03 | Média | `zod` < 4.6.6: esgotamento de memória ao validar coleções grandes (GHSA-mrhx-c7xc-m3w5); exploração difícil (corpo limitado a 1 MB, chamadas assinadas) | Corrigido (zod 4.6.7; 87 testes passam) + limite de linhas no cadastro em lote |
| F-04 | Média | `next` 15 embute `postcss` 8.4.31 (avisos de leitura de `.map` e XSS de serialização; só em tempo de build) | Corrigido (`overrides` → 8.5.33) |
| F-05 | Baixa | `@hono/node-server` com falha em `serveStatic` (não usado pelo projeto) | Corrigido (2.1.9) |
| F-06 | Baixa | 10 avisos altos só em **ferramentas de desenvolvimento** (cadeia do `tailwindcss` 3: `picomatch`, `micromatch`…). Não vão para produção | Aceito; migração do Tailwind planejada |
| F-07 | Baixa | Documentação com detalhes operacionais internos (host da API, usuário/porta de SSH, caminhos locais) | Corrigido no arquivo atual; permanece em commits antigos (impacto baixo, sem credenciais) |
| F-08 | Baixa | `.gitignore` não cobria credenciais em HTML/TXT, chaves, dumps; não havia `.dockerignore` | Corrigido |
| F-09 | Média | Sem mecanismos preventivos (hook, Gitleaks, CI de segurança, Dependabot, política de reporte) | **Corrigido**: arquivos publicados e proteções do GitHub ativadas (Secret Scanning, Push Protection, Dependabot, proteção da `main`) |
| F-10 | Baixa | Login de professor responde ~4× mais devagar que o de aluno/inexistente (custo do bcrypt), permitindo inferir quais usuários de professor existem | Aceito (mitigado pelo limite de tentativas); ver plano |
| F-11 | Baixa | PIN de aluno com 6 dígitos (10⁶ combinações) e bloqueio por usuário permite bloqueio temporário de uma conta por terceiros | Aceito (risco inerente ao desenho para crianças; limite de 10 falhas/15 min por usuário) |
| F-12 | Baixa | Backups só na própria VPS (sem cópia externa configurada) | **Depende de autorização** (infraestrutura) |
| F-13 | Info | Verificado e correto: banco sem porta publicada, API sem porta no host, sistema de arquivos somente leitura, `cap_drop: ALL`, `no-new-privileges`, usuário não root, segredos em arquivo com permissão 600 | Sem ação |
| F-14 | Info | Parte do banco de questões do 7º ano deriva de material da SEDUC-SP; confirmar permissão/atribuição antes de manter público | Aceito; recomendação |

Correção adicional de privacidade (minimização): tentativas de login antigas, que guardam IP, passam a ser apagadas após 24 h (teste automatizado).

## O que já está bem (verificado)
Senhas e PINs com bcrypt; sessões com token aleatório de 256 bits guardado só como hash, cookie `HttpOnly`/`SameSite=Lax`/`Secure` em produção, expiração (8 h aluno, 4 h professor); limites de login por IP e por usuário; resposta idêntica para usuário inexistente e senha errada; API acessível só pelo gateway com assinatura HMAC, janela de validade e proteção contra repetição; autorização **no servidor** por perfil e por posse (turma/aluno) em todas as rotas, incluindo exclusão em lote tudo-ou-nada; consultas parametrizadas; validação de entrada; CSV com neutralização de injeção de fórmula; erros genéricos sem detalhes internos; logs sem corpo, query string ou cookies; gabarito e pontuação nunca enviados ao aluno.

## Referências aplicadas
OWASP Top 10, OWASP ASVS (autenticação, sessão, controle de acesso, validação), OWASP API Security Top 10 (BOLA/IDOR, autenticação quebrada, exposição excessiva de dados, consumo irrestrito de recursos), CWE, NIST SSDF, ISO/IEC 27001/27002 como referência de controles, LGPD e orientações da ANPD. **Isto não é certificação nem declaração de conformidade com nenhuma norma.**

## Limitações
- Não foi feito teste de intrusão em produção nem em infraestrutura de terceiros (por desenho).
- Os fluxos do GitHub foram executados no PR #26 e na `main` (Segredos, Dependências e testes passaram; o Gitleaks apontou 1 falso positivo conhecido, avaliado e registrado).
- Navegador testado: Chrome (CSP e telas); Firefox/Safari não testados.
- O histórico foi varrido por padrões conhecidos; segredos sem formato reconhecível podem escapar. A rotação periódica de segredos continua recomendada.
- Uma auditoria não elimina todos os riscos.
