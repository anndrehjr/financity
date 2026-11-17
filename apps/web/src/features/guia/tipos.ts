export type Expressao = "feliz" | "pensando" | "preocupada" | "comemorando";
export type Fala = { expressao: Expressao; texto: string };
export type TipoMomento = "sequencia" | "unica" | "sorteio";
export type Momento = {
  tipo: TipoMomento;
  quando?: string;
  /** Só dispara se não houver nenhuma fala aberta (ex.: "parado"). */
  somenteSeLivre?: boolean;
  falas: Fala[];
};
export type Falas = { versao: number; momentos: Record<string, Momento> };
/** `ids` = id estável de cada fala (ex.: "acerto.2"), usado para achar o áudio pré-gerado. */
export type Aberta = { momento: string; falas: Fala[]; indice: number; ids?: string[] };
export type Trecho = { texto: string; negrito: boolean };
