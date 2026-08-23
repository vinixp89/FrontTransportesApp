import { useTheme } from '../context/ThemeContext'

// Botão de alternar tema, reaproveitado no cabeçalho de toda página — o tema é global
// (ThemeContext liga a classe "dark" no <html>), então um botão só já vale pro site inteiro.
// `variant="purple"` é usado nas páginas do motorista, pra combinar com a cor de marca roxa.
const CORES_VARIANTE = {
  neutro: 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
  purple: 'border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-200 dark:hover:bg-purple-900',
}

export default function ThemeToggleButton({ className = '', variant = 'neutro' }) {
  const { tema, alternarTema } = useTheme()

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={tema === 'light' ? 'Mudar pra tema escuro' : 'Mudar pra tema claro'}
      className={`rounded-lg border px-3 py-1.5 text-sm ${CORES_VARIANTE[variant]} ${className}`}
    >
      {tema === 'light' ? '🌙 Escuro' : '☀️ Claro'}
    </button>
  )
}
