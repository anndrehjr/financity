# Falas da Nina só do 7º ano — para gerar na ElevenLabs

> **STATUS (2026-11-18): JÁ GERADAS E CORTADAS.** O áudio `origem/geradas/7.mp3` foi alinhado pelo texto (cortar-alinhado.py) e as 5 falas estão em `apps/web/public/guia/nina/audio/`. Este arquivo fica só como registro.
> **Correção:** a versão anterior dizia que linhas em branco viram pausa. Não viram: o gerador usa ` <break time="1.5s" />` entre as falas (veja `tools/nina-voz/gerar.ts`). Por isso o áudio saiu sem pausas e o corte foi feito pelo texto falado, não pelas pausas.

São as **4 falas de abertura de tema** do 7º ano **mais 1 fala geral que ainda não tem áudio** ("Seus temas chegam em breve!", a tela que o 7º ano vê enquanto não há temas). As outras falas gerais (as falas gerais — acerto, erro, ajuda, tema concluído, vitória — já servem aos dois anos e já têm áudio).
Os nomes dos temas seguem `docs/REVISAO-CONTEUDO-7-ANO.md`. Se você mudar um nome de tema, avise para eu ajustar a fala.

## Configuração (a mesma das outras falas)
Voz sylphiette · Multilingual v2 · Velocidade 0,96 · Estabilidade 57 · Similaridade 75 · Estilo 0 · Speaker boost ligado

## Texto para gerar (um áudio só, com pausa de 1,5 s entre as falas)
Texto das falas, na ordem (para gerar de novo, separe as falas com ` <break time="1.5s" />`). Se a voz ler a marca `<break ... />` em voz alta, me avise.

```
Tema um: renda e trabalho. De onde vem o dinheiro e o que os dados mostram.

Tema dois: controle do dinheiro. Extrato e fatura contam para onde o dinheiro vai.

Tema três: compras e porcentagem. Leia o cupom e faça as contas antes de pagar.

Tema quatro: metas e gráficos. Planeje o dinheiro e leia os dados com atenção.

Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui.
```

Salve como `tools/nina-voz/origem/geradas/nina-bloco-7ano.mp3`. Depois me avise: eu corto nas pausas, confiro o que a voz falou e gero um MP3 por fala.

## Tabela (id do arquivo final, legenda que aparece no site e animação)

| # | id (arquivo final) | texto falado | legenda no site | animação | quando toca |
|---|---|---|---|---|---|
| 1 | s7.mapa_1.1 | Tema um: renda e trabalho. De onde vem o dinheiro e o que os dados mostram. | Tema 1: **renda e trabalho**. De onde vem o dinheiro e o que os dados mostram. | feliz | abertura do Tema 1 |
| 2 | s7.mapa_2.1 | Tema dois: controle do dinheiro. Extrato e fatura contam para onde o dinheiro vai. | Tema 2: **controle do dinheiro**. Extrato e fatura contam para onde o dinheiro vai. | pensando | abertura do Tema 2 |
| 3 | s7.mapa_3.1 | Tema três: compras e porcentagem. Leia o cupom e faça as contas antes de pagar. | Tema 3: **compras e porcentagem**. Leia o cupom e faça as contas antes de pagar. | pensando | abertura do Tema 3 |
| 4 | s7.mapa_4.1 | Tema quatro: metas e gráficos. Planeje o dinheiro e leia os dados com atenção. | Tema 4: **metas e gráficos**. Planeje o dinheiro e leia os dados com atenção. | feliz | abertura do Tema 4 |
| 5 | sem_temas.1 | Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui. | Seus temas chegam em breve! Quando estiverem prontos, eles aparecem aqui. | feliz | tela "Seus temas chegam em breve" (já está no ar para o 7º ano) |

Total: 5 falas, cerca de 385 caracteres (o plano gratuito tem ≈ 10.000 créditos/mês).
