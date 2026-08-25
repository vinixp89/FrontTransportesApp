import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'
import MotoristaOnlineCard from '../components/MotoristaOnlineCard'

export default function HomePage() {
  const { usuario, logout } = useAuth()
  const ehMotorista = usuario.roles.includes('Motorista')

  return (
    // Perfil Motorista tem a cor de marca roxa (ver constants/brand.js) — aqui isso vira o fundo
    // da página inteira, por cima do verde padrão que o body já usa pra tela do cliente.
    <div className={`min-h-screen ${ehMotorista ? 'bg-purple-50 dark:bg-purple-950' : ''}`}>
      <AppNavbar brand variantLogo={ehMotorista ? 'purple' : 'padrao'}>
        <ThemeToggleButton variant={ehMotorista ? 'purple' : 'neutro'} />
        {ehMotorista ? (
          // UserMenu leva pra telas exclusivas de Cliente (extrato, saldo de corrida, carteira),
          // então pro motorista mostramos só o botão de sair.
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sair
          </button>
        ) : (
          <UserMenu usuario={usuario} onSair={logout} />
        )}
      </AppNavbar>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h2 className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">Olá!</h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          Perfil: {usuario.roles.length > 0 ? usuario.roles.join(', ') : 'sem perfil definido'}
        </p>

        {ehMotorista ? (
          <div className="flex flex-wrap gap-4">
            <MotoristaOnlineCard />

            <Link
              to="/motorista/corridas"
              className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-lg transition hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <span className="text-2xl">🚗</span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Corridas
              </span>
            </Link>

            <Link
              to="/motorista/extrato"
              className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-lg transition hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <span className="text-2xl">📄</span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Extrato de corridas
              </span>
            </Link>
          </div>
        ) : (
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
        )}
      </main>
    </div>
  )
}
