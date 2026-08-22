// Mapeamento visual (cor, destaque) dos planos — o conteúdo de verdade (nome, preço, benefícios)
// vem do catálogo da API (GET /Planos/catalogo), esse arquivo só cuida da aparência de cada
// cartão, igual faixas.js faz pros pacotes de corrida.
const ESTILO_PLANO = {
  0: {
    borda: 'border-gray-200 dark:border-gray-600',
    botao: 'bg-gray-700 hover:bg-gray-800',
    destaque: false,
  },
  1: {
    borda: 'border-green-500 dark:border-green-500 ring-1 ring-green-500',
    botao: 'bg-green-600 hover:bg-green-700',
    destaque: true,
    selo: 'Mais popular',
  },
  2: {
    borda: 'border-purple-300 dark:border-purple-500',
    botao: 'bg-purple-600 hover:bg-purple-700',
    destaque: false,
  },
  // Diamante (topo de linha) — ring azul-claro pra remeter a "diamante" sem repetir o roxo do Premium.
  3: {
    borda: 'border-sky-400 dark:border-sky-500 ring-1 ring-sky-400',
    botao: 'bg-sky-600 hover:bg-sky-700',
    destaque: true,
    selo: 'Top de linha',
  },
}

export function obterEstiloPlano(tipo) {
  return ESTILO_PLANO[tipo] ?? ESTILO_PLANO[0]
}
