# Política de segurança

O Financity é uma aplicação educacional que lida com dados de estudantes menores de idade. Tratamos a segurança e a privacidade como requisito, não como detalhe.

## Como reportar uma vulnerabilidade
**Não abra uma issue pública.** Use o relato privado do GitHub:
**Security → Report a vulnerability** neste repositório.

Inclua o que foi observado, como reproduzir (com contas **fictícias**) e o impacto. Responderemos o quanto antes e manteremos você informado até a correção.

Por favor:
- não acesse, copie ou divulgue dados reais de alunos, professores ou da escola;
- não faça testes de negação de serviço, força bruta ou engenharia social;
- não teste contra a infraestrutura de produção além do mínimo necessário para demonstrar o problema.

## O que fazemos para proteger o projeto
- Autenticação com senhas e PINs em `bcrypt`, sessões revogáveis, cookies `HttpOnly`/`SameSite`/`Secure`, limite de tentativas de login.
- Autorização **no servidor** por perfil e por posse do dado (turma/aluno); o front-end nunca é a única barreira.
- API acessível só pelo gateway, com chamadas assinadas (HMAC), janela de validade e proteção contra repetição.
- Cabeçalhos de segurança no site, incluindo `Content-Security-Policy` e HSTS.
- Contêineres sem porta publicada para o banco, sistema de arquivos somente leitura e privilégios mínimos.
- Varredura automática de segredos (Gitleaks e verificador próprio), auditoria de dependências e Dependabot.

Detalhes e limitações da última auditoria: `docs/security/`.

## Segredos e dados pessoais
Nunca versione senhas, tokens, chaves, arquivos `.env`, dumps de banco, listas de alunos ou cartões de credenciais. O `.gitignore` e o hook de pre-commit (`git config core.hooksPath .githooks`) ajudam, mas não substituem atenção. Se algo sensível for publicado por engano, trate como comprometido: **rotacione** o segredo e avise o mantenedor.
