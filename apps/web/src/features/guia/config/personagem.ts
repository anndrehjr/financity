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
    posicao: "inferior-esquerda" as "inferior-esquerda" | "inferior-direita",
    corDestaque: "#1fa38a",
    // Arte atual: Nina 3D estilizada (vista frontal, fundo transparente). Para TROCAR a imagem, substitua os arquivos em
    // public/guia/nina/ (mesmo nome) OU mude os caminhos abaixo e informe a largura/altura reais do arquivo (a proporção é preservada).
    arte: {
      corpo: "/guia/nina/nina-3d.webp",       // corpo inteiro (tutorial e balão)
      rosto: "/guia/nina/nina-3d-rosto.webp", // miniatura redonda do botão "ver tutorial"
      largura: 347,
      altura: 700,
      alt: "Nina, Guardiã Veterana",
    },
    // Altura da Nina na tela, em px (a largura é proporcional). Celular: ajusta entre min e max conforme a altura da tela.
    altura: { desktop: 220, tablet: 170, celularMin: 110, celularMax: 140 },
    // Distância da borda da tela (inferior e lateral), em px.
    margemPx: 16,
    // Só para a arte em camadas (Phaser), usada quando houver camadas no manifesto.
    tamanhoPx: 220,
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
