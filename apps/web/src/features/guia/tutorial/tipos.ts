import type { Expressao } from "../tipos";

/** Estados de animação da Nina (ver docs/nina/ASSETS-NECESSARIOS.md). */
export type EstadoNina =
  | "idle" | "talking" | "happy" | "celebrating" | "thinking" | "explaining" | "pointing" | "encouraging" | "surprised" | "goodbye";

/** Alvo do destaque: elemento do DOM (data-tutorial), retângulo registrado por outra camada (ex.: cena Phaser) ou nenhum. */
export type Alvo =
  | { tipo: "dom"; seletor: string }
  | { tipo: "retangulo"; id: string }
  | { tipo: "nenhum" };

export type Etapa = {
  id: string;
  texto: string;
  expressao?: Expressao;
  estado?: EstadoNina;
  alvo?: Alvo;
  /** Só avança quando este evento acontecer (e a condição, se houver, for verdadeira). */
  esperar?: { evento: string; condicao?: (payload: any) => boolean; timeoutMs?: number };
  /** Reação da Nina depois que a ação real acontece. */
  aoConcluir?: { texto: string; expressao?: Expressao; estado?: EstadoNina };
  /** "auto": depois de confirmar, avança sozinha. "manual": o aluno clica em Próximo. */
  avancar?: "auto" | "manual";
  /** Tempo para avançar sozinha no modo auto (ms). */
  autoMs?: number;
  /** Permite pular o tutorial inteiro nesta etapa (padrão: sim). */
  pular?: boolean;
};

export type Tutorial = { id: string; titulo: string; etapas: Etapa[] };

export type Fase = "exibindo" | "aguardando" | "confirmando" | "fim";

export type Snapshot = {
  tutorialId: string;
  indice: number;
  total: number;
  etapa: Etapa | null;
  fase: Fase;
  texto: string;
  expressao: Expressao;
  estado: EstadoNina;
  alvo: Alvo;
  podeAvancar: boolean;
  podeVoltar: boolean;
  podePular: boolean;
  tempoEsgotado: boolean;
  pausado: boolean;
  concluido: boolean;
};
