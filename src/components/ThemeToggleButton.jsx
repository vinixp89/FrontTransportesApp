import { useTheme } from '../context/ThemeContext'

// Botão de alternar tema, reaproveitado no cabeçalho de toda página — o tema é global
// (ThemeContext liga a classe "dark" no <html>), então um botão só já vale pro site inteiro.
export default function ThemeToggleButton({ className = '' }) {
  const { tema, alternarTema } = useTheme()

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={tema === 'light' ? 'Mudar pra tema escuro' : 'Mudar pra tema claro'}
      className={`rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
    >
      {tema === 'light' ? '🌙 Escuro' : '☀️ Claro'}
    </button>
  )
}
