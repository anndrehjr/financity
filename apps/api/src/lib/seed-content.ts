import { seedMapas234 } from "./seed-mapas.js";
import { tx } from "./db.js";

/** Conteúdo aprovado do Mapa 1. Inserido apenas se ainda não existir (nunca sobrescreve edições do professor). */

export const MAPS = [
  { sort: 1, slug: "consumo-consciente", title: "Consumo Consciente", subtitle: "A Cidade do Consumo", topics: ["Consumismo", "Fast fashion", "Sustentabilidade"], status: "available" },
  { sort: 2, slug: "economia-decisoes", title: "Economia e Decisões", subtitle: "O Mercado das Escolhas", topics: ["Porcentagens", "Promoções", "Inflação"], status: "available" },
  { sort: 3, slug: "planejamento-financeiro", title: "Planejamento Financeiro", subtitle: "O Bairro do Futuro", topics: ["Orçamento", "Receitas e despesas", "Reserva de emergência"], status: "available" },
  { sort: 4, slug: "cidadania-financeira", title: "Cidadania Financeira", subtitle: "A Cidade Digital", topics: ["Ética", "Segurança", "Prioridades financeiras"], status: "available" },
] as const;

type Opt = { text: string; points: number; why: string };
type Q = {
  number: number; title: string; theme: string; scene: string; scenario: string; dialog: string; prompt: string;
  note: string; strength: string; retake: string; options: Opt[]; // options em ordem A..E
};

export const MAP1_QUESTIONS: Q[] = [
  {
    number: 1, title: "A Promoção Inesperada", theme: "Consumismo", scene: "shoe",
    scenario: "Alex passa por uma loja de calçados e encontra uma promoção.",
    dialog: "Olha só, que vitrine! Será que vale a pena entrar? Preciso da sua ajuda para decidir.",
    prompt: "Você tem R$ 300 guardados. Ao passar por uma loja, encontra um tênis com 40% de desconto. Seu tênis atual ainda está em boas condições. Qual decisão demonstra maior consciência financeira?",
    note: "Avalia compras por impulso: necessidade, orçamento, pesquisa de preço e autocontrole.",
    strength: "controle de compras por impulso e análise da necessidade",
    retake: "compras por impulso e avaliação da real necessidade diante de promoções",
    options: [
      { text: "Comprar imediatamente no cartão, sem verificar os gastos do mês.", points: 0, why: "Compra impulsiva sem planejamento." },
      { text: "Comprar à vista porque possui dinheiro suficiente.", points: 2, why: "Evita dívidas, mas não considera a necessidade da compra." },
      { text: "Comparar preços em outras lojas e comprar se estiver dentro do orçamento.", points: 3, why: "Considera preço e orçamento, mas não avalia plenamente a necessidade." },
      { text: "Adiar a compra e reavaliar a necessidade no próximo mês.", points: 4, why: "Demonstra autocontrole e evita a decisão imediata." },
      { text: "Avaliar a necessidade, pesquisar o preço real e decidir não comprar agora, pois o tênis atual ainda atende às suas necessidades.", points: 5, why: "Considera necessidade, orçamento, preço e prioridades." },
    ],
  },
  {
    number: 2, title: "A Moda das Redes Sociais", theme: "Fast fashion", scene: "trend",
    scenario: "Alex recebe um convite para uma festa e encontra uma tendência de roupas nas redes sociais.",
    dialog: "Todo mundo está postando essa roupa! Mas será que eu preciso mesmo de uma nova?",
    prompt: "Uma nova tendência de roupas está fazendo sucesso nas redes sociais. Você foi convidado para uma festa, mas já possui roupas adequadas para a ocasião. Qual seria a melhor decisão?",
    note: "Avalia fast fashion: reaproveitamento, compartilhamento e pressão social pelo consumo.",
    strength: "reaproveitamento de roupas e resistência à pressão da moda",
    retake: "fast fashion e a influência das redes sociais no consumo de roupas",
    options: [
      { text: "Reutilizar as roupas que já possui, criando uma combinação diferente.", points: 5, why: "Evita gastos desnecessários e estimula o reaproveitamento." },
      { text: "Pedir uma peça emprestada, se houver essa possibilidade e todos estiverem de acordo.", points: 4, why: "Evita uma compra e compartilha recursos." },
      { text: "Procurar uma peça usada, em bom estado, que também possa ser utilizada em outras ocasiões.", points: 3, why: "Considera reutilização, embora realize uma compra." },
      { text: "Comprar uma peça barata da tendência, mesmo já possuindo roupas adequadas.", points: 2, why: "Considera o preço, mas mantém um consumo pouco necessário." },
      { text: "Comprar várias peças da tendência para acompanhar a moda, sem avaliar a necessidade.", points: 0, why: "Representa consumo impulsivo e potencial desperdício." },
    ],
  },
  {
    number: 3, title: "O Destino das Roupas", theme: "Sustentabilidade", scene: "jeans",
    scenario: "Alex encontra uma calça jeans com um pequeno rasgo.",
    dialog: "Opa, minha calça preferida rasgou um pouquinho. O que será que eu faço com ela?",
    prompt: "Você possui uma calça jeans com um pequeno rasgo, mas o restante da peça está em boas condições. Pensando no consumo sustentável, o que seria mais adequado fazer?",
    note: "Avalia sustentabilidade: durabilidade, reparo e reaproveitamento de materiais.",
    strength: "sustentabilidade e reaproveitamento de materiais",
    retake: "sustentabilidade, reparo e prolongamento da vida útil dos produtos",
    options: [
      { text: "Jogar a calça no lixo sem avaliar outras possibilidades.", points: 0, why: "Desconsidera o reaproveitamento." },
      { text: "Guardar a calça indefinidamente, sem consertá-la nem decidir como utilizá-la.", points: 2, why: "Evita o descarte imediato, mas não resolve o problema." },
      { text: "Transformar a calça em outro objeto útil, caso não queira mais utilizá-la como roupa.", points: 3, why: "Reaproveita o material." },
      { text: "Procurar um reparo acessível, avaliando o custo e a possibilidade de continuar usando a peça.", points: 4, why: "Considera conservação, custo e durabilidade." },
      { text: "Reparar o pequeno rasgo e continuar utilizando a calça normalmente.", points: 5, why: "Prolonga diretamente a vida útil da peça e evita uma substituição desnecessária." },
    ],
  },
  {
    number: 4, title: "A Oferta por Tempo Limitado", theme: "Publicidade", scene: "ad",
    scenario: "Alex recebe uma propaganda com a mensagem \"50% de desconto — somente hoje!\".",
    dialog: "Eita, o relógio da promoção está correndo! Isso é uma boa oportunidade ou uma pegadinha?",
    prompt: "Uma loja virtual anuncia um produto que você não estava planejando comprar. A propaganda diz que a promoção termina hoje, mas não informa o preço anterior do produto. Qual atitude seria mais consciente?",
    note: "Avalia análise crítica da publicidade: urgência artificial, verificação de preços e planejamento.",
    strength: "análise crítica de promoções e publicidade",
    retake: "análise crítica de promoções, publicidade e compras por impulso",
    options: [
      { text: "Comprar imediatamente, pois uma promoção de 50% não pode ser desperdiçada.", points: 0, why: "Aceita o apelo publicitário sem avaliar necessidade ou preço." },
      { text: "Comprar porque possui dinheiro disponível, mesmo sem precisar do produto.", points: 2, why: "Evita dívidas, mas realiza uma compra desnecessária." },
      { text: "Pesquisar o preço anterior e verificar a reputação da loja antes de decidir comprar.", points: 3, why: "Verifica informações importantes, mas ainda precisa considerar a necessidade." },
      { text: "Aguardar, comparar preços e verificar se a compra se encaixa no planejamento financeiro.", points: 4, why: "Reduz o impulso e considera o orçamento." },
      { text: "Reconhecer a pressão da propaganda, pesquisar os preços e priorizar seus objetivos financeiros, deixando de comprar algo que não precisa.", points: 5, why: "Demonstra análise crítica e responsabilidade financeira." },
    ],
  },
  {
    number: 5, title: "A Festa Sustentável", theme: "Consumo sustentável", scene: "party",
    scenario: "Alex participa da organização de uma pequena confraternização escolar.",
    dialog: "Vamos organizar o lanche da turma! Quero que seja gostoso, barato e sem desperdício.",
    prompt: "Seu grupo precisa organizar um lanche coletivo com um orçamento limitado. Além de economizar, a turma quer evitar desperdício de alimentos e excesso de embalagens. Qual decisão seria mais adequada?",
    note: "Avalia planejamento coletivo, orçamento e redução de desperdício e de embalagens.",
    strength: "planejamento, orçamento e redução de desperdício",
    retake: "consumo responsável, planejamento de quantidades e redução de embalagens",
    options: [
      { text: "Comprar sem planejamento, escolhendo grandes quantidades de produtos e descartando o que sobrar.", points: 0, why: "Pode gerar gastos desnecessários e desperdício." },
      { text: "Comprar vários produtos em embalagens individuais pela praticidade, sem considerar a quantidade de resíduos.", points: 2, why: "Prioriza a conveniência e desconsidera parte do impacto ambiental." },
      { text: "Escolher alguns produtos com embalagens recicláveis, mas sem calcular exatamente a quantidade necessária.", points: 3, why: "Considera um aspecto ambiental, mas não planeja adequadamente as quantidades." },
      { text: "Fazer uma lista, calcular as quantidades necessárias e respeitar o orçamento disponível.", points: 4, why: "Demonstra planejamento e controle de desperdícios." },
      { text: "Planejar as quantidades, comparar preços, respeitar o orçamento e priorizar recipientes reutilizáveis ou produtos com menos embalagens.", points: 5, why: "Integra economia, sustentabilidade e planejamento." },
    ],
  },
];

/**
 * Idempotente: só cria o que falta (matéria, mapas, avaliações do 8º ano e as 5 questões do Mapa 1).
 * Nunca sobrescreve pontuações ou textos já existentes. Rodado por `npm run migrate -- --seed`, não a cada inicialização.
 */
export async function seedContent() {
  await seedBase();
  await seedMapas234(); // Mapas 2–4 (conteúdo em src/content); idempotente
}

async function seedBase() {
  await tx(async (c) => {
    await c.query("INSERT INTO subjects(slug,name) VALUES ('educacao-financeira','Educação Financeira') ON CONFLICT(slug) DO NOTHING");
    const subj = (await c.query("SELECT id FROM subjects WHERE slug='educacao-financeira'")).rows[0].id as number;
    for (const m of MAPS) {
      await c.query(
        "INSERT INTO maps(sort,slug,title,subtitle,topics,status,subject_id) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT(slug) DO NOTHING",
        [m.sort, m.slug, m.title, m.subtitle, JSON.stringify(m.topics), m.status, subj],
      );
      // o sistema atual atende o 8º ano: cada mapa vira uma avaliação do 8º ano (ordem e situação por série).
      await c.query(
        "INSERT INTO assessments(map_id,grade,sort,status) SELECT id,8,$2,$3 FROM maps WHERE slug=$1 ON CONFLICT DO NOTHING",
        [m.slug, m.sort, m.status],
      );
    }
    const map1 = (await c.query("SELECT id FROM maps WHERE slug='consumo-consciente'")).rows[0].id as number;
    for (const q of MAP1_QUESTIONS) {
      if ((await c.query("SELECT 1 FROM questions WHERE map_id=$1 AND number=$2", [map1, q.number])).rowCount) continue;
      const r = await c.query(
        `INSERT INTO questions(map_id,number,title,theme,scene,scenario,dialog,prompt,note,strength,retake)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [map1, q.number, q.title, q.theme, q.scene, q.scenario, q.dialog, q.prompt, q.note, q.strength, q.retake],
      );
      for (const [i, o] of q.options.entries())
        await c.query("INSERT INTO options(question_id,letter,text,points,why) VALUES ($1,$2,$3,$4,$5)", [r.rows[0].id, "ABCDE"[i], o.text, o.points, o.why]);
    }
  });
}
