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
    tamanhoPx: 170,
    posicao: "inferior-esquerda" as "inferior-esquerda" | "inferior-direita",
    corDestaque: "#1fa38a",
  },
  // Plano gratuito da ElevenLabs exige atribuição; no plano pago ponha false.
  creditos: { mostrarElevenLabs: true, texto: "Voz gerada com ElevenLabs (elevenlabs.io)" },
  comportamento: {
    velocidadeDigitacaoMs: 28,
    segundosParado: 30,
    // Se false, a Nina não comenta o resultado de cada resposta (hoje o jogo não mostra se acertou).
    reagirAoResultado: true,
    // Pontos (0 a 5) a partir dos quais a resposta conta como "acerto"; abaixo de minParcial = "erro".
    minAcerto: 4,
    minParcial: 2,
    chaveSilenciada: "financity_nina_silenciada",
  },
};
