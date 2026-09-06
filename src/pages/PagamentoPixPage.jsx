import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'
import { STATUS_PAGAMENTO } from '../constants/planos'

const INTERVALO_MS = 4000

// Tela do QR Code Pix (gerado direto via Checkout API do Mercado Pago — ver
// CorridaService.IniciarCorridaAvulsaPixAsync no backend, mesmo padrão da tela equivalente do app
// mobile). Os dados do QR Code vêm via location.state (não dá URL) porque o "copia e cola" e a
// imagem base64 são grandes demais/sensíveis demais pra ficar na barra de endereço.
export default function PagamentoPixPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dados = location.state

  const [status, setStatus] = useState(STATUS_PAGAMENTO.PENDENTE)
  const [copiado, setCopiado] = useState(false)
  const intervaloRef = useRef(null)

  const sincronizar = useCallback(async () => {
    if (!dados) return

    try {
      const { data } = await api.post(`/Pagamentos/sincronizar/${dados.pagamentoGatewayId}`)
      setStatus(data.status)

      if (data.status === STATUS_PAGAMENTO.APROVADO) {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
        navigate(`/corrida/${dados.corridaId}`, { replace: true })
      } else if (data.status === STATUS_PAGAMENTO.RECUSADO || data.status === STATUS_PAGAMENTO.CANCELADO) {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
      }
    } catch {
      // Falha pontual de rede no polling não é motivo pra parar — só ignora e tenta de novo.
    }
  }, [dados, navigate])

  useEffect(() => {
    if (!dados) return

    sincronizar()
    intervaloRef.current = setInterval(sincronizar, INTERVALO_MS)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [dados, sincronizar])

  if (!dados) {
    return (
      <div className="min-h-screen pb-16">
        <AppNavbar titulo="Pagar com Pix">
          <ThemeToggleButton />
        </AppNavbar>
        <main className="mx-auto mt-8 max-w-md px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Essa tela precisa ser aberta a partir do pedido de corrida.
          </p>
          <Link to="/pedir-corrida" className="mt-4 inline-block text-sm font-medium text-green-600 hover:underline">
            Voltar pra pedir corrida
          </Link>
        </main>
      </div>
    )
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(dados.qrCodeCopiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const finalizado = status === STATUS_PAGAMENTO.RECUSADO || status === STATUS_PAGAMENTO.CANCELADO

  const statusInfo = (() => {
    switch (status) {
      case STATUS_PAGAMENTO.APROVADO:
        return { texto: 'Pagamento aprovado! Redirecionando...', cor: 'text-green-600 dark:text-green-400' }
      case STATUS_PAGAMENTO.RECUSADO:
        return { texto: 'Pagamento recusado. Volte e tente de novo.', cor: 'text-red-600 dark:text-red-400' }
      case STATUS_PAGAMENTO.CANCELADO:
        return { texto: 'Esse pagamento foi cancelado.', cor: 'text-red-600 dark:text-red-400' }
      default:
        return { texto: 'Aguardando você pagar o Pix...', cor: 'text-gray-500 dark:text-gray-400' }
    }
  })()

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Pagar com Pix">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-md px-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pague com Pix pra confirmar a corrida
          </h2>

          <img
            src={`data:image/png;base64,${dados.qrCodeBase64}`}
            alt="QR Code Pix"
            className="mx-auto mt-5 h-56 w-56 rounded-lg border border-gray-200 dark:border-gray-700"
          />

          <button
            type="button"
            onClick={handleCopiar}
            className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {copiado ? 'Copiado!' : 'Copiar código Pix'}
          </button>

          <p className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${statusInfo.cor}`}>
            {!finalizado && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {statusInfo.texto}
          </p>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Abra o app do seu banco, escolha pagar com Pix "Copia e Cola" e cole o código copiado
            acima. Assim que o pagamento cair, a corrida é liberada automaticamente pro motorista.
          </p>

          {finalizado && (
            <Link
              to="/pedir-corrida"
              className="mt-5 inline-block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Voltar e tentar de novo
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
