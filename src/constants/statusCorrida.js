// StatusCorrida vem serializado como número (TransportesApp.Domain/Enums/Enums.cs):
// 0 Solicitada, 1 Confirmada, 2 MotoristaACaminho (não usado ainda), 3 EmAndamento,
// 4 Finalizada, 5 Cancelada, 6 AguardandoPagamento (só corrida avulsa, antes do Mercado Pago confirmar).
export const STATUS_LABEL = {
  0: { texto: 'Solicitada', cor: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
  1: { texto: 'Motorista a caminho', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  2: { texto: 'A caminho', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  3: { texto: 'Em andamento', cor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
  4: { texto: 'Finalizada', cor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  5: { texto: 'Cancelada', cor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  6: { texto: 'Aguardando pagamento', cor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
}

export function obterStatusLabel(status) {
  return STATUS_LABEL[status] ?? STATUS_LABEL[0]
}
