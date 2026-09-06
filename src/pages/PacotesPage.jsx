import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function PacotesPage() {
  const navigate = useNavigate()

  const [catalogo, setCatalogo] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [comprando, setComprando] = useState('') // "faixa-quantidade" do item em compra, pra desabilitar só aquele botão
  // Item que o cliente clicou, esperando ele escolher Pix ou cartão/boleto — "" quando nenhum
  // está selecionado.
  const [selecionado, setSelecionado] = useState('')

  useEffect(() => {
    api
      .get('/PacotesCorridas/catalogo')
      .then(({ data }) => setCatalogo(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  async function handleComprarPix(faixaValor, quantidade) {
    const chave = `${faixaValor}-${quantidade}`
    setComprando(chave)
    setErro('')

    try {
      const { data } = await api.post('/PacotesCorridas/comprar-pix', { faixa: faixaValor, quantidade })
      setSelecionado('')
      navigate('/pagamento-pix', {
        state: {
          pagamentoGatewayId: data.pagamentoGatewayId,
          qrCodeCopiaCola: data.qrCodeCopiaCola,
          qrCodeBase64: data.qrCodeBase64,
          aoAprovar: { tipo: 'pacote' },
        },
      })
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setComprando('')
    }
  }

  async function handleComprarCartaoBoleto(faixaValor, quantidade) {
    const chave = `${faixaValor}-${quantidade}`
    setComprando(chave)
    setErro('')

    try {
      const { data } = await api.post('/PacotesCorridas/comprar', { faixa: faixaValor, quantidade })
      setSelecionado('')
      window.location.href = data.checkoutUrl
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setComprando('')
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Pacotes de corrida">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Cada pacote vale só pra corridas que caírem na mesma faixa de distância. O preço é o
          mesmo da corrida avulsa multiplicado pela quantidade — a vantagem é já deixar pago e
          pronto pra usar.
        </p>

        {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando catálogo...</p>}

        <div className="flex flex-col gap-4">
          {catalogo.map((item) => {
            const faixa = obterFaixa(item.faixa)
            return (
              <div
                key={item.faixa}
                className={`rounded-2xl p-5 shadow dark:brightness-90 ${faixa.badge} ${faixa.texto}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold">{faixa.nome}</h3>
                  <span className="text-xs opacity-80">
                    ({faixa.km} — avulsa {formatarPreco(item.precoAvulso)})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {item.tamanhos.map((tamanho) => {
                    const chave = `${item.faixa}-${tamanho.quantidade}`
                    return (
                      <button
                        key={chave}
                        type="button"
                        disabled={comprando === chave}
                        onClick={() => setSelecionado((atual) => (atual === chave ? '' : chave))}
                        className={`flex flex-col items-center gap-1 rounded-xl border bg-white/25 px-3 py-3 text-center backdrop-blur-sm transition hover:bg-white/40 disabled:opacity-50 ${
                          selecionado === chave ? 'border-2 border-white' : 'border-black/10'
                        }`}
                      >
                        <span className="text-sm font-semibold">
                          {tamanho.quantidade} corridas
                        </span>
                        <span className="text-xs opacity-90">
                          {comprando === chave ? 'Comprando...' : formatarPreco(tamanho.preco)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {item.tamanhos.some((t) => `${item.faixa}-${t.quantidade}` === selecionado) && (
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const [, quantidade] = selecionado.split('-')
                        handleComprarPix(item.faixa, Number(quantidade))
                      }}
                      className="flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-white/90"
                    >
                      Pagar com Pix
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [, quantidade] = selecionado.split('-')
                        handleComprarCartaoBoleto(item.faixa, Number(quantidade))
                      }}
                      className="flex-1 rounded-lg border border-white/60 bg-white/30 px-3 py-2.5 text-sm font-semibold transition hover:bg-white/40"
                    >
                      Cartão / Boleto
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
