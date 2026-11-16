/** Formato de uma questão (igual ao usado no Mapa 1), mais metadados curriculares só para revisão do professor. */
export type Opcao = { text: string; points: 0 | 2 | 3 | 4 | 5; why: string };

export type Bloom = "Compreender" | "Aplicar" | "Analisar" | "Avaliar" | "Criar";

export type Questao = {
  number: number;
  title: string;
  theme: string;
  /** chave da ilustração (src/components/art.tsx). Chaves novas precisam de arte; até lá a tela cai na ilustração padrão. */
  scene: string;
  scenario: string;
  dialog: string;
  prompt: string;
  note: string;
  strength: string;
  retake: string;
  options: Opcao[]; // ordem A..E é a ordem de escrita; o sistema embaralha para o aluno
  /** só para o relatório de revisão (não vai para o banco) */
  bloom: Bloom;
  bncc: string;
};

export type MapaConteudo = {
  slug: string;
  title: string;
  subtitle: string;
  topics: string[];
  questions: Questao[];
};

export const TCT = "Tema transversal: Educação Financeira";
