import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'
import { STATUS_PAGAMENTO } from '../constants/planos'

// Tela que o Mercado Pago abre de volta depois do checkout (sucesso, pendente ou falha — as 3 URLs
// de retorno apontam todas pra cá, ver PagamentoService.IniciarPagamentoAsync). Não confia no que a
// URL diz sobre o resultado: sempre chama o backend pra sincronizar/confirmar de verdade com o
// Mercado Pago antes de mostrar qualquer coisa (ver PagamentosController.Sincronizar).
export default function PagamentoRetornoPage() {
  const [searchParams] = useSearchParams()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [statusPagamento, setStatusPagamento] = useState(null)

  // O Mercado Pago sempre acrescenta esses parâmetros na URL de volta — payment_id é o nome atual,
  // collection_id é o mesmo campo em fluxos mais antigos do Checkout Pro.
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')

  useEffect(() => {
    if (!paymentId) {
      setErro('Não veio nenhum identificador de pagamento na URL de retorno.')
      setCarregando(false)
      return
    }

    api
      .post(`/Pagamentos/sincronizar/${paymentId}`)
      .then(({ data }) => setStatusPagamento(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [paymentId])

  const conteudo = (() => {
    if (carregando) {
      return {
        titulo: 'Confirmando pagamento...',
        descricao: 'Só um instante, estamos confirmando com o Mercado Pago.',
        cor: 'text-gray-500 dark:text-gray-400',
      }
    }

    if (erro) {
      return { titulo: 'Não foi possível confirmar', descricao: erro, cor: 'text-red-600 dark:text-red-400' }
    }

    switch (statusPagamento?.status) {
      case STATUS_PAGAMENTO.APROVADO:
        return {
          titulo: 'Pagamento aprovado!',
          descricao: 'Sua assinatura já está ativa — aproveite os benefícios do seu plano.',
          cor: 'text-green-600 dark:text-green-400',
        }
      case STATUS_PAGAMENTO.RECUSADO:
        return {
          titulo: 'Pagamento recusado',
          descricao: 'O Mercado Pago recusou esse pagamento. Você pode tentar de novo com outro cartão ou forma de pagamento.',
          cor: 'text-red-600 dark:text-red-400',
        }
      case STATUS_PAGAMENTO.CANCELADO:
        return {
          titulo: 'Pagamento cancelado',
          descricao: 'Esse pagamento foi cancelado.',
          cor: 'text-red-600 dark:text-red-400',
        }
      case STATUS_PAGAMENTO.EM_PROCESSAMENTO:
      case STATUS_PAGAMENTO.PENDENTE:
        return {
          titulo: 'Pagamento em análise',
          descricao: 'O Mercado Pago ainda está processando esse pagamento (comum em boleto/Pix). Assim que for aprovado, sua assinatura ativa automaticamente.',
          cor: 'text-yellow-600 dark:text-yellow-400',
        }
      default:
        return {
          titulo: 'Status desconhecido',
          descricao: 'Não conseguimos identificar o status desse pagamento — confira a tela de planos em alguns instantes.',
          cor: 'text-gray-500 dark:text-gray-400',
        }
    }
  })()

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Pagamento">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-md px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow dark:bg-gray-800">
          <h2 className={`text-xl font-semibold ${conteudo.cor}`}>{conteudo.titulo}</h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{conteudo.descricao}</p>

          <Link
            to="/planos"
            className="mt-6 inline-block rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Ver meus planos
          </Link>
        </div>
      </main>
    </div>
  )
}
