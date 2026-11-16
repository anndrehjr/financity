export type Expressao = "feliz" | "pensando" | "preocupada" | "comemorando";
export type Fala = { expressao: Expressao; texto: string };
export type TipoMomento = "sequencia" | "unica" | "sorteio";
export type Momento = {
  tipo: TipoMomento;
  quando?: string;
  /** "alta" = tutorial: não é interrompido por reações (elas são descartadas enquanto ele estiver aberto). */
  prioridade?: "alta" | "normal";
  /** Só dispara se não houver nenhuma fala aberta (ex.: "parado"). */
  somenteSeLivre?: boolean;
  falas: Fala[];
};
export type Falas = { versao: number; momentos: Record<string, Momento> };
export type Aberta = { momento: string; falas: Fala[]; indice: number; protegida: boolean };
export type Trecho = { texto: string; negrito: boolean };
