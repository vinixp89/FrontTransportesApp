import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function SaldoCorridaPage() {
  const [pacotes, setPacotes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/PacotesCorridas/meus-pacotes')
      .then(({ data }) => setPacotes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  const totalRestante = pacotes.reduce((soma, p) => soma + p.quantidadeRestante, 0)
  const comSaldo = pacotes.filter((p) => p.quantidadeRestante > 0)
  const semSaldo = pacotes.filter((p) => p.quantidadeRestante === 0)

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Saldo de corridas">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <div className="mb-6 rounded-2xl bg-green-600 p-6 text-white shadow-lg dark:bg-green-700">
          <p className="text-sm text-green-100">Corridas disponíveis em pacotes</p>
          <p className="text-3xl font-bold">{totalRestante}</p>
        </div>

        {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}
        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && pacotes.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Você ainda não tem nenhum pacote de corridas.</p>
            <Link
              to="/pacotes"
              className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Comprar pacote
            </Link>
          </div>
        )}

        {comSaldo.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            {comSaldo.map((p) => {
              const faixa = obterFaixa(p.faixa)
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${faixa.badge}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{faixa.nome}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Comprado por {formatarPreco(p.precoPago)} em{' '}
                        {new Date(p.dataCompra).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {p.quantidadeRestante}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">/{p.quantidadeTotal}</span>
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {semSaldo.length > 0 && (
          <details className="mb-6 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
              Pacotes já usados ({semSaldo.length})
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {semSaldo.map((p) => {
                const faixa = obterFaixa(p.faixa)
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${faixa.badge}`} />
                      {faixa.nome}
                    </span>
                    <span>0/{p.quantidadeTotal}</span>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {pacotes.length > 0 && (
          <Link
            to="/pacotes"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Comprar mais pacotes
          </Link>
        )}
      </main>
    </div>
  )
}
