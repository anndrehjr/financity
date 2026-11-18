## O que muda
<!-- Descreva o que foi alterado e por quê, de forma objetiva. -->

## Como foi verificado
- [ ] `tsc` sem erro (API e site)
- [ ] Testes da API e do site passando
- [ ] Build de produção do site
- [ ] Testado manualmente (descreva)

## Segurança e privacidade
- [ ] Não há segredos, tokens, chaves, `.env`, dumps ou dados reais de alunos/professores
- [ ] Hook ativo: `git config core.hooksPath .githooks` (ou `node scripts/verificar-segredos.mjs --staged`)
- [ ] Novas rotas verificam o perfil (aluno/professor) **no servidor** e a posse do dado (turma/aluno)
- [ ] Entradas validadas no servidor; sem dados pessoais em logs ou mensagens de erro
- [ ] Se mexe em migração ou banco de produção: backup feito e plano de reversão descrito

## Observações
<!-- Riscos, pendências, necessidade de autorização para publicar. -->
