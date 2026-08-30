import { useEffect, useMemo, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { obterStatusLabel, STATUS_LABEL } from '../constants/statusCorrida'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function AdminCorridasPage() {
  const [corridas, setCorridas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')

  useEffect(() => {
    api
      .get('/Corridas/admin')
      .then(({ data }) => setCorridas(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  const corridasFiltradas = useMemo(() => {
    return corridas.filter((c) => {
      if (statusFiltro !== 'todos' && String(c.status) !== statusFiltro) return false

      if (busca.trim()) {
        const alvo = `${c.clienteNome} ${c.clienteEmail}`.toLowerCase()
        if (!alvo.includes(busca.trim().toLowerCase())) return false
      }

      return true
    })
  }, [corridas, busca, statusFiltro])

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — todas as corridas">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-5xl px-4">
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente (nome ou e-mail)"
            className="min-w-64 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([valor, { texto }]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {corridasFiltradas.length} corrida{corridasFiltradas.length === 1 ? '' : 's'}
          </span>
        </div>

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && corridasFiltradas.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma corrida encontrada.</p>
          </div>
        )}

        {corridasFiltradas.length > 0 && (
          <div className="overflow-x-auto rounded-2xl bg-white shadow dark:bg-gray-800">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-700 dark:text-gray-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Motorista</th>
                  <th className="px-4 py-3 font-medium">Trajeto</th>
                  <th className="px-4 py-3 font-medium">Faixa</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {corridasFiltradas.map((c) => {
                  const faixa = obterFaixa(c.faixaContratada)
                  const status = obterStatusLabel(c.status)

                  return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 dark:border-gray-700/50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(c.dataSolicitacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-100">{c.clienteNome}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{c.clienteEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {c.motoristaPlaca ? (
                          <>
                            {c.motoristaModelo}
                            <br />
                            <span className="text-xs text-gray-400 dark:text-gray-500">{c.motoristaPlaca}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Sem motorista</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {c.origem.bairro} → {c.destino.bairro}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${faixa.suave}`}>
                          <span className={`h-2 w-2 rounded-full ${faixa.badge}`} />
                          {faixa.nome}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                        {formatarPreco(c.valorReferencia)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.cor}`}>
                          {status.texto}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
