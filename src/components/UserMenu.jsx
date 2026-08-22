import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Menu suspenso do cabeçalho: abre ao clicar no e-mail do usuário, fecha ao clicar fora ou
// selecionar um item. Os 3 itens levam pras telas de extrato, saldo de corridas (pacotes) e
// saldo em reais (carteira).
export default function UserMenu({ usuario, onSair }) {
  const [aberto, setAberto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function aoClicarFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  const itens = [
    { rotulo: 'Extrato', to: '/extrato', icone: '📄' },
    { rotulo: 'Saldo de corrida', to: '/saldo-corridas', icone: '🎟️' },
    { rotulo: 'Saldo em reais', to: '/carteira', icone: '💰' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <span>{usuario.email}</span>
        <span className={`text-xs transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {itens.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setAberto(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span>{item.icone}</span>
              {item.rotulo}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setAberto(false)
              onSair()
            }}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <span>🚪</span>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
