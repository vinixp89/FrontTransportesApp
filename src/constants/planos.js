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

// Espelha StatusAssinatura do backend (TransportesApp.Domain/Enums/Enums.cs) — os enums do backend
// vêm sempre como número (sem JsonStringEnumConverter em lugar nenhum da API), então essas chaves
// são a fonte de verdade de "o que cada número significa" no front.
export const STATUS_ASSINATURA = {
  PENDENTE_PAGAMENTO: 0,
  ATIVA: 1,
  PAGAMENTO_RECUSADO: 2,
  CANCELADA: 3,
}

// Espelha StatusPagamento do backend — usado só pela tela de retorno do pagamento (PagamentoRetornoPage).
export const STATUS_PAGAMENTO = {
  PENDENTE: 0,
  EM_PROCESSAMENTO: 1,
  APROVADO: 2,
  RECUSADO: 3,
  CANCELADO: 4,
  ESTORNADO: 5,
}
