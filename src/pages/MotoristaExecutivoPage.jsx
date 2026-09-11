import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco } from '../constants/faixas'
import { STATUS_ASSINATURA } from '../constants/planos'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const ANO_ATUAL = new Date().getFullYear()

// Assinatura da categoria Executivo do motorista — veículo até 3 anos (sedan médio ou SUV), R$99,90,
// pagamento único via Mercado Pago (mesmo fluxo do Planos do cliente, ver PlanosPage). Só depois de
// confirmada é que o motorista passa a ver/aceitar corridas Executivo (ver CorridaService no backend).
export default function MotoristaExecutivoPage() {
  const [assinatura, setAssinatura] = useState(null)
  const [anoVeiculo, setAnoVeiculo] = useState(String(ANO_ATUAL))
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api
      .get('/Motoristas/executivo/assinatura')
      .then(({ data }) => setAssinatura(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  const ativa = assinatura?.status === STATUS_ASSINATURA.ATIVA
  const pendente = assinatura?.status === STATUS_ASSINATURA.PENDENTE_PAGAMENTO

  async function handleAssinar(event) {
    event.preventDefault()
    setProcessando(true)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Motoristas/executivo/assinar', { anoVeiculo: Number(anoVeiculo) })

      // O backend só devolve checkoutUrl quando tem pagamento pra fazer — se o motorista já tinha
      // assinatura ativa, vem null e nada a pagar de novo (ver AssinaturaMotoristaExecutivoService).
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      setAssinatura(data.assinatura)
      setMensagemSucesso('Assinatura Executivo confirmada!')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function handleCancelar() {
    setCancelando(true)
    setErro('')
    setMensagemSucesso('')

    try {
      await api.post('/Motoristas/executivo/cancelar')
      setAssinatura(null)
      setMensagemSucesso('Assinatura Executivo cancelada.')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-16 dark:bg-purple-950">
      <AppNavbar titulo="Categoria Executivo">
        <ThemeToggleButton variant="purple" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-md px-4">
        <div className="overflow-hidden rounded-2xl bg-gray-900 p-6 text-white shadow-xl">
          <h2 className="text-lg font-bold uppercase tracking-wide">Executivo</h2>
          <p className="mt-1 text-3xl font-bold">{formatarPreco(99.9)}<span className="text-sm font-normal text-gray-400">/mês</span></p>
          <ul className="mt-4 space-y-1.5 text-sm text-gray-300">
            <li>• Corridas com valor mais alto por faixa</li>
            <li>• Veículo com até 3 anos de fabricação</li>
            <li>• Sedan médio ou SUV</li>
          </ul>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
          {mensagemSucesso && (
            <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {mensagemSucesso}
            </p>
          )}
          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {erro}
            </p>
          )}

          {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

          {!carregando && ativa && (
            <div className="flex flex-col gap-3">
              <span className="rounded-lg border border-green-600 px-4 py-2 text-center text-sm font-medium text-green-700 dark:border-green-500 dark:text-green-400">
                Assinatura Executivo ativa
              </span>
              <button
                type="button"
                onClick={handleCancelar}
                disabled={cancelando}
                className="text-xs text-gray-400 hover:text-red-500 hover:underline disabled:opacity-50 dark:text-gray-500 dark:hover:text-red-400"
              >
                {cancelando ? 'Cancelando...' : 'Cancelar assinatura'}
              </button>
            </div>
          )}

          {!carregando && !ativa && (
            <form onSubmit={handleAssinar} className="flex flex-col gap-4">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Ano de fabricação do veículo
                <input
                  type="number"
                  required
                  min={ANO_ATUAL - 3}
                  max={ANO_ATUAL}
                  value={anoVeiculo}
                  onChange={(e) => setAnoVeiculo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                  Precisa ser {ANO_ATUAL - 3} ou mais recente.
                </span>
              </label>

              {pendente && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Você tem um pagamento pendente — continue pra confirmar.
                </p>
              )}

              <button
                type="submit"
                disabled={processando}
                className="rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {processando ? 'Redirecionando...' : pendente ? 'Continuar pagamento' : 'Assinar Executivo'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
