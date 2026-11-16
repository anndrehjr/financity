// Tutoriais cadastrados. Cada um é uma lista de etapas declarativas (ver tipos.ts).
// Alvos usam atributos data-tutorial="..." (não classes CSS). Textos curtos: o balão tem no máximo ~2 linhas.
import type { Tutorial } from "./tipos";

export const PRIMEIROS_PASSOS: Tutorial = {
  id: "primeiros-passos",
  titulo: "Primeiros passos",
  etapas: [
    { id: "ola", texto: "Oi! Eu sou a **Nina**. Vou te mostrar como o Financity funciona, na prática.", expressao: "feliz", estado: "happy", avancar: "manual" },
    { id: "mapas", texto: "São **4 temas**, com 8 desafios cada. Eles abrem um de cada vez, em ordem.", expressao: "feliz", estado: "explaining",
      alvo: { tipo: "dom", seletor: "[data-tutorial='lista-mapas']" }, avancar: "manual" },
    { id: "entrar", texto: "Vamos começar? **Clique** em entrar no tema 1.", expressao: "feliz", estado: "pointing",
      alvo: { tipo: "dom", seletor: "[data-tutorial='entrar-mapa-1']" },
      esperar: { evento: "mapa:entrou", timeoutMs: 45000 }, aoConcluir: { texto: "Boa! Agora vamos para o desafio.", expressao: "comemorando", estado: "happy" }, avancar: "auto", autoMs: 1200 },
    { id: "comecar", texto: "Leia a introdução e clique em **Começar aventura**.", expressao: "feliz", estado: "pointing",
      alvo: { tipo: "dom", seletor: "[data-tutorial='comecar']" },
      esperar: { evento: "atividade:iniciada", timeoutMs: 60000 }, aoConcluir: { texto: "Isso! Primeiro desafio na tela.", expressao: "comemorando", estado: "happy" }, avancar: "auto", autoMs: 1200 },
    { id: "opcoes", texto: "Leia a situação e **escolha** a alternativa que você acha mais adequada.", expressao: "pensando", estado: "thinking",
      alvo: { tipo: "dom", seletor: "[data-tutorial='opcoes']" },
      esperar: { evento: "opcao:selecionada", timeoutMs: 90000 }, aoConcluir: { texto: "Ótimo! Você pode mudar de ideia até confirmar.", expressao: "feliz", estado: "happy" }, avancar: "auto", autoMs: 1800 },
    { id: "confirmar", texto: "Quando tiver certeza, **confirme**. Depois disso a resposta não muda.", expressao: "preocupada", estado: "pointing",
      alvo: { tipo: "dom", seletor: "[data-tutorial='confirmar']" },
      esperar: { evento: "pergunta:respondida", timeoutMs: 90000 }, aoConcluir: { texto: "Resposta registrada! Você já sabe o caminho.", expressao: "comemorando", estado: "celebrating" }, avancar: "auto", autoMs: 2200 },
    { id: "tchau", texto: "Pronto! Eu fico por aqui se precisar. **Bons estudos!**", expressao: "comemorando", estado: "goodbye", avancar: "manual", pular: false },
  ],
};

export const TUTORIAIS: Record<string, Tutorial> = { [PRIMEIROS_PASSOS.id]: PRIMEIROS_PASSOS };
export const TUTORIAL_INICIAL = PRIMEIROS_PASSOS.id;
