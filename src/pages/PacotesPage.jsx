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
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api
      .get('/PacotesCorridas/catalogo')
      .then(({ data }) => setCatalogo(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  async function handleComprar(faixaValor, quantidade) {
    const chave = `${faixaValor}-${quantidade}`
    setComprando(chave)
    setErro('')
    setMensagemSucesso('')

    try {
      await api.post('/PacotesCorridas', { faixa: faixaValor, quantidade })
      const faixa = obterFaixa(faixaValor)
      setMensagemSucesso(`Pacote de ${quantidade} corridas ${faixa.nome} comprado com sucesso!`)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
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

        {mensagemSucesso && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            <span>{mensagemSucesso}</span>
            <button
              type="button"
              onClick={() => navigate('/saldo-corridas')}
              className="ml-3 shrink-0 font-medium underline"
            >
              Ver meus pacotes
            </button>
          </div>
        )}

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
                        onClick={() => handleComprar(item.faixa, tamanho.quantidade)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-black/10 bg-white/25 px-3 py-3 text-center backdrop-blur-sm transition hover:bg-white/40 disabled:opacity-50"
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
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
