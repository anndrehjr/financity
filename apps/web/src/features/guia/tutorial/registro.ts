// Tutoriais cadastrados. Cada um é uma lista de etapas declarativas (ver tipos.ts).
// Alvos usam atributos data-tutorial="..." (não classes CSS). Textos curtos: o balão tem no máximo ~2 linhas.
// Áudio: cada etapa procura em public/guia/nina/audio/manifest.json a fala "tutorial.<id do tutorial>.<id da etapa>".
// As etapas "abertura-N" e "tchau" usam a gravação original; as demais ainda NÃO têm áudio (só legenda) — ver tools/nina-voz/PARA-GRAVAR.md.
// A legenda das etapas com áudio é a mesma de tools/nina-voz/falas-originais.json (um teste confere).
import type { Tutorial } from "./tipos";

export const PRIMEIROS_PASSOS: Tutorial = {
  id: "primeiros-passos",
  titulo: "Primeiros passos",
  etapas: [
    { id: "abertura-1", texto: "Oiê! Que alegria ter você aqui.", expressao: "feliz", estado: "happy", avancar: "manual" },
    { id: "abertura-2", texto: "Eu sou a **Nina**, sua amiga e guia nesta incrível aventura pelo mundo da educação financeira.", expressao: "feliz", estado: "explaining", avancar: "manual" },
    { id: "abertura-3", texto: "Seja muito bem-vindo ao **Financity**.", expressao: "comemorando", estado: "happy", avancar: "manual" },
    { id: "abertura-4", texto: "Você já parou para pensar em como pequenas decisões podem transformar o seu futuro?", expressao: "pensando", estado: "thinking", avancar: "manual" },
    { id: "abertura-5", texto: "Pois é. Às vezes, uma escolha que parece simples pode fazer uma diferença enorme na nossa vida. E é exatamente isso que vamos descobrir juntos.", expressao: "feliz", estado: "explaining", avancar: "manual" },
    { id: "abertura-6", texto: "Aqui no Financity, você vai aprender a cuidar do seu dinheiro, planejar seus sonhos, entender como funcionam os investimentos e descobrir os desafios de administrar uma empresa.", expressao: "feliz", estado: "explaining", avancar: "manual" },
    { id: "abertura-7", texto: "Mas calma, não precisa saber tudo agora. Eu vou estar aqui para ajudar você em cada etapa dessa jornada.", expressao: "feliz", estado: "happy", avancar: "manual" },
    { id: "abertura-8", texto: "Afinal, o mais importante não é acertar tudo de primeira, mas compreender o que estamos aprendendo. Agora me conta, você está preparado para começar essa aventura?", expressao: "feliz", estado: "explaining", avancar: "manual" },
    { id: "abertura-9", texto: "Eu estou super animada. Então vamos lá. Respire fundo, prepare suas ideias e venha comigo explorar o incrível mundo da educação financeira.", expressao: "comemorando", estado: "celebrating", avancar: "manual" },
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
    { id: "tchau", texto: "Eu sou a **Nina** e estarei ao seu lado nessa jornada. Até já, futuro empreendedor.", expressao: "comemorando", estado: "goodbye", avancar: "manual", pular: false },
  ],
};

export const TUTORIAIS: Record<string, Tutorial> = { [PRIMEIROS_PASSOS.id]: PRIMEIROS_PASSOS };
export const TUTORIAL_INICIAL = PRIMEIROS_PASSOS.id;
