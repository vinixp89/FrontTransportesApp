import api, { extrairMensagemErro } from '../api/client'
import { useEffect, useState } from 'react'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { obterStatusLabel } from '../constants/statusCorrida'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function ExtratoCorridasPage() {
  const [corridas, setCorridas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/Corridas/minhas')
      .then(({ data }) => setCorridas(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <div className="min-h-screen bg-purple-50 pb-16 dark:bg-purple-950">
      <AppNavbar titulo="Extrato de corridas">
        <ThemeToggleButton variant="purple" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}
        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && corridas.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma corrida no seu histórico ainda.
            </p>
          </div>
        )}

        {corridas.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-gray-800">
            {corridas.map((c, indice) => {
              const faixa = obterFaixa(c.faixaContratada)
              const status = obterStatusLabel(c.status)

              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-3 px-5 py-4 ${
                    indice > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${faixa.badge}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {c.origem.bairro} → {c.destino.bairro}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(c.dataSolicitacao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {formatarPreco(c.valorReferencia)}
                    </p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.cor}`}>
                      {status.texto}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
