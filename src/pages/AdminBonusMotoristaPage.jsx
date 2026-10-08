import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

function formatarData(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Lista de quem pegou vaga no bônus de boas-vindas dos motoristas (ver AdminBonusMotoristaController):
// o valor já está no saldo de cada um, mas só pode ser sacado depois da 1ª corrida finalizada.
export default function AdminBonusMotoristaPage() {
  const [status, setStatus] = useState(null)
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const [respStatus, respLista] = await Promise.all([
          api.get('/admin/bonus-motorista/status'),
          api.get('/admin/bonus-motorista/lista'),
        ])
        setStatus(respStatus.data)
        setLista(respLista.data)
      } catch (error) {
        setErro(extrairMensagemErro(error))
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — bônus de motoristas">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-3xl px-4">
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {status && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {status.vagasRestantes}{' '}
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                {status.vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'} de {status.limiteVagas}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              R$ {status.valorBonus} por motorista, já creditado no saldo no cadastro. Só pode ser sacado depois que
              ele finalizar a 1ª corrida.
            </p>
          </div>
        )}

        {!carregando && lista.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum motorista pegou vaga ainda.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {lista.map((item) => (
            <div
              key={item.motoristaId}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow dark:bg-gray-800"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.telefone} · cadastrou em {formatarData(item.dataConcedido)}
                </p>
              </div>

              {item.liberado ? (
                <span className="flex-shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                  Liberado {item.dataLiberacao && `em ${formatarData(item.dataLiberacao)}`}
                </span>
              ) : (
                <span className="flex-shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  Aguardando 1ª corrida
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
