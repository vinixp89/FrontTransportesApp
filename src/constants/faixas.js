// Espelha a tabela de faixas do backend (TransportesApp.Domain/ValueObjects/FaixaDistancia.cs) só pra
// nome/cor de exibição — o valor em si (preco) vem da API (`valorReferencia` na resposta de
// estimar/criar corrida), não é mais calculado no front.
// `suave` é a versão em paleta clara/pastel de cada cor (usada nos cards da tela de pacotes) —
// fundo bem claro + texto escuro no modo claro, e fundo escuro translúcido + texto claro no
// modo escuro, mantendo a mesma identidade de cor sem ficar num tom saturado demais.
export const FAIXAS = [
  {
    valor: 0,
    nome: 'Azul',
    km: '1 a 5 km',
    badge: 'bg-blue-500',
    hex: '#3b82f6',
    texto: 'text-white',
    suave: 'bg-blue-50 text-blue-900 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900',
  },
  {
    valor: 1,
    nome: 'Amarela',
    km: '5,1 a 10 km',
    badge: 'bg-yellow-400',
    hex: '#facc15',
    texto: 'text-gray-900',
    suave: 'bg-yellow-50 text-yellow-900 border border-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900',
  },
  {
    valor: 2,
    nome: 'Laranja',
    km: '10,1 a 15 km',
    badge: 'bg-orange-500',
    hex: '#f97316',
    texto: 'text-white',
    suave: 'bg-orange-50 text-orange-900 border border-orange-100 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900',
  },
  {
    valor: 3,
    nome: 'Vermelha',
    km: '15,1 a 20 km',
    badge: 'bg-red-500',
    hex: '#ef4444',
    texto: 'text-white',
    suave: 'bg-red-50 text-red-900 border border-red-100 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
  },
  {
    valor: 4,
    nome: 'Rosa',
    km: '20,1 a 30 km',
    badge: 'bg-pink-400',
    hex: '#f472b6',
    texto: 'text-gray-900',
    suave: 'bg-pink-50 text-pink-900 border border-pink-100 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900',
  },
  {
    valor: 5,
    nome: 'Verde',
    km: '30,1 a 40 km',
    badge: 'bg-green-500',
    hex: '#22c55e',
    texto: 'text-white',
    suave: 'bg-green-50 text-green-900 border border-green-100 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900',
  },
  {
    valor: 6,
    nome: 'Roxa',
    km: '40,1 a 50 km',
    badge: 'bg-purple-500',
    hex: '#a855f7',
    texto: 'text-white',
    suave: 'bg-purple-50 text-purple-900 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900',
  },
]

export function obterFaixa(valor) {
  return FAIXAS.find((f) => f.valor === valor) ?? FAIXAS[0]
}

export function formatarPreco(preco) {
  return Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarDuracao(minutos) {
  if (minutos == null) return null
  const total = Math.round(minutos)
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto > 0 ? `${horas}h${resto}min` : `${horas}h`
}
