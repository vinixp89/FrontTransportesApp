import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

// Barra superior com efeito "fluido": no topo da página fica maior e bem translúcida; ao rolar,
// encolhe, ganha mais opacidade/blur e uma sombra leve — dá a sensação de flutuar sobre o
// conteúdo em vez de só ficar fixa e estática. Usa classes do Bootstrap (navbar, container-fluid)
// pra estrutura, e Tailwind pro tema claro/escuro — as duas libs convivem numa classe só.
export default function AppNavbar({ titulo, brand = false, variantLogo = 'padrao', children }) {
  const [rolou, setRolou] = useState(false)

  useEffect(() => {
    function aoRolar() {
      setRolou(window.scrollY > 10)
    }

    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <nav
      className={`navbar navbar-expand sticky-top px-3 px-md-4 dark:bg-gray-800/90 ${
        rolou ? 'py-2 shadow-sm bg-white/90 backdrop-blur' : 'py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm'
      }`}
      style={{ transition: 'all 0.25s ease' }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between px-0">
        <div className="d-flex align-items-center gap-3">
          {brand ? (
            <BrandLogo tamanho={rolou ? 24 : 28} variant={variantLogo} />
          ) : (
            <>
              <Link to="/" className="text-decoration-none small text-success fw-medium dark:text-green-400">
                ← Início
              </Link>
              <span className="fw-semibold dark:text-white" style={{ fontSize: rolou ? '0.95rem' : '1.05rem', transition: 'font-size 0.25s ease' }}>
                {titulo}
              </span>
            </>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">{children}</div>
      </div>
    </nav>
  )
}
