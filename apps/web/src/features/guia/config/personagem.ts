// Quem é a Nina e como ela aparece. Tudo que for "jeito de ser" ou "aparência" fica AQUI (e em falas-nina.json),
// nunca espalhado no código. Para trocar o visual: coloque as imagens em public/guia/nina/ e mude visual.tipo.
export const personagem = {
  ativo: true, // desliga a Nina inteira
  id: "nina",
  nome: "Nina",
  titulo: "Guardiã Veterana",
  // Personalidade: só documentação para quem escreve falas. Não é usada no código.
  personalidade: "PROVISÓRIO — definir depois",
  visual: {
    tipo: "nina" as "nina" | "svg-placeholder" | "imagem", // "nina" = Nina anime em camadas (imagem de referência enquanto a arte não chega)
    imagens: {
      feliz: "/guia/nina/feliz.png",
      pensando: "/guia/nina/pensando.png",
      preocupada: "/guia/nina/preocupada.png",
      comemorando: "/guia/nina/comemorando.png",
    },
    tamanhoPx: 170,
    posicao: "inferior-esquerda" as "inferior-esquerda" | "inferior-direita",
    corDestaque: "#1fa38a",
  },
  comportamento: {
    // Tutorial guiado por eventos (Driver.js + Nina). Se false, volta ao tutorial antigo de falas.
    tutorialGuiado: true,
    velocidadeDigitacaoMs: 28,
    segundosParado: 30,
    // Se false, a Nina não comenta o resultado de cada resposta (hoje o jogo não mostra se acertou).
    reagirAoResultado: true,
    // Pontos (0 a 5) a partir dos quais a resposta conta como "acerto"; abaixo de minParcial = "erro".
    minAcerto: 4,
    minParcial: 2,
    chaveTutorialVisto: "financity_nina_tutorial_visto",
    chaveSilenciada: "financity_nina_silenciada",
  },
};
