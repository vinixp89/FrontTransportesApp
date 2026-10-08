import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'
import MotoristaOnlineCard from '../components/MotoristaOnlineCard'

export default function HomePage() {
  const { usuario, logout } = useAuth()
  const ehMotorista = usuario.roles.includes('Motorista')
  const ehAdmin = usuario.roles.includes('Admin')
  const [suportePendentes, setSuportePendentes] = useState(0)
  const [bonusStatus, setBonusStatus] = useState(null)

  // Aviso de "nova mensagem" no card Suporte: conta as conversas em que o usuário falou por último.
  // Falha de rede é ignorada de propósito — é só um indicador, não deve poluir a Home.
  useEffect(() => {
    if (!ehAdmin) return undefined

    let ativo = true
    async function buscar() {
      try {
        const { data } = await api.get('/admin/suporte/pendentes/contagem')
        if (ativo) setSuportePendentes(data.total)
      } catch {
        // ignora
      }
    }

    // Vagas restantes do bônus de boas-vindas dos motoristas — só informativo, mesma regra de ignorar falha.
    async function buscarBonus() {
      try {
        const { data } = await api.get('/admin/bonus-motorista/status')
        if (ativo) setBonusStatus(data)
      } catch {
        // ignora
      }
    }

    buscar()
    buscarBonus()
    const intervalo = setInterval(buscar, 15000)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [ehAdmin])

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

            <Link
              to="/motorista/executivo"
              className="flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-900 p-3 text-center shadow-lg transition hover:bg-gray-800"
            >
              <span className="text-2xl">⭐</span>
              <span className="text-sm font-semibold text-white">
                Categoria Executivo
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/corridas"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Painel Admin</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Veja o histórico de todas as corridas do sistema.
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/executivo"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Aprovar Executivo</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Confira a placa/foto do carro antes de liberar a assinatura.
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/avisos"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Avisos do app</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Crie o pop-up de promoção/novidade que aparece ao abrir o app Cliente.
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/saques"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Saques de motoristas</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Aprove ou rejeite os pedidos de saque pendentes.
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/suporte"
                className="relative rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                {suportePendentes > 0 && (
                  <span className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {suportePendentes}
                  </span>
                )}
                <h3 className="text-lg font-semibold">Suporte</h3>
                <p className="mt-1 text-sm text-gray-300">
                  {suportePendentes > 0
                    ? `${suportePendentes} ${suportePendentes === 1 ? 'conversa aguardando' : 'conversas aguardando'} resposta.`
                    : 'Veja e responda as mensagens de Clientes e Motoristas.'}
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && bonusStatus && (
              <div className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold">Bônus de motoristas</h3>
                <p className="mt-1 text-2xl font-bold">
                  {bonusStatus.vagasRestantes}{' '}
                  <span className="text-sm font-normal text-gray-300">
                    {bonusStatus.vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'} de {bonusStatus.limiteVagas}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  R$ {bonusStatus.valorBonus} por motorista · {bonusStatus.vagasReservadas} cadastrados ·{' '}
                  {bonusStatus.bonusLiberados} {bonusStatus.bonusLiberados === 1 ? 'já fez' : 'já fizeram'} a 1ª corrida
                </p>
              </div>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/notificacoes"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Notificações push</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Mande um aviso que chega mesmo com o app fechado.
                </p>
              </Link>
            )}

            {usuario.roles.includes('Admin') && (
              <Link
                to="/admin/motoristas"
                className="rounded-2xl bg-gray-800 p-6 text-white shadow-lg transition hover:bg-gray-900"
              >
                <h3 className="text-lg font-semibold">Motoristas cadastrados</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Veja todos os dados, veículo e fotos de verificação.
                </p>
              </Link>
            )}

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

                <Link
                  to="/doar-corrida"
                  className="rounded-2xl bg-pink-500 p-6 text-white shadow-lg transition hover:bg-pink-600"
                >
                  <h3 className="text-lg font-semibold">Doar corrida</h3>
                  <p className="mt-1 text-sm text-pink-50">
                    Presenteie outra pessoa com uma corrida — sai do seu saldo em reais.
                  </p>
                </Link>
              </>
            ) : (
              !usuario.roles.includes('Admin') && (
                <div className="rounded-2xl bg-white p-6 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Pedir corrida</h3>
                  <p className="mt-1 text-sm">
                    Disponível apenas para contas com perfil Cliente.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  )
}
