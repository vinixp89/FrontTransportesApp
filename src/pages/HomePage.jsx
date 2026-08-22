import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function HomePage() {
  const { usuario, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <AppNavbar brand>
        <ThemeToggleButton />
        <UserMenu usuario={usuario} onSair={logout} />
      </AppNavbar>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h2 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">Olá!</h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          Perfil: {usuario.roles.length > 0 ? usuario.roles.join(', ') : 'sem perfil definido'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usuario.roles.includes('Cliente') ? (
            <>
              <Link
                to="/pedir-corrida"
                className="rounded-2xl bg-green-600 p-6 text-white shadow-lg transition hover:bg-green-700"
              >
                <h3 className="text-lg font-semibold">Pedir corrida</h3>
                <p className="mt-1 text-sm text-green-100">
                  Informe origem e destino e veja o valor na hora.
                </p>
              </Link>

              <Link
                to="/pacotes"
                className="rounded-2xl bg-yellow-500 p-6 text-white shadow-lg transition hover:bg-yellow-600"
              >
                <h3 className="text-lg font-semibold">Pacote de corrida</h3>
                <p className="mt-1 text-sm text-yellow-50">
                  Compre corridas por faixa e deixe prontas pra usar quando precisar.
                </p>
              </Link>

              <Link
                to="/planos"
                className="rounded-2xl bg-purple-600 p-6 text-white shadow-lg transition hover:bg-purple-700"
              >
                <h3 className="text-lg font-semibold">Planos</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Assine um plano e ganhe desconto e prioridade nas corridas.
                </p>
              </Link>
            </>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Pedir corrida</h3>
              <p className="mt-1 text-sm">
                Disponível apenas para contas com perfil Cliente.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
