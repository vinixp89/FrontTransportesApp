import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// Doar uma corrida pra outro cliente: busca o destinatário por e-mail exato (nunca por nome, pra não
// virar uma lista pesquisável de clientes — ver ClientesController.Buscar) e, uma vez achado, escolhe
// de onde sai a corrida doada — da carteira (debita o preço avulso) ou de um pacote que o próprio
// doador já tem (consome 1 corrida dele, sem cobrar de novo) — ver DoacaoService.DoarAsync.
export default function DoarCorridaPage() {
  const [catalogo, setCatalogo] = useState([])
  const [carteira, setCarteira] = useState(null)
  const [meusPacotes, setMeusPacotes] = useState([])

  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [destinatario, setDestinatario] = useState(null)
  const [doando, setDoando] = useState(null) // "carteira-<faixa>" ou "pacote-<id>"
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api.get('/PacotesCorridas/catalogo').then(({ data }) => setCatalogo(data))
    carregarCarteira()
    carregarMeusPacotes()
  }, [])

  function carregarCarteira() {
    return api.get('/Carteiras/minha-carteira').then(({ data }) => setCarteira(data))
  }

  function carregarMeusPacotes() {
    return api.get('/PacotesCorridas/meus-pacotes').then(({ data }) => setMeusPacotes(data))
  }

  const pacotesDisponiveis = meusPacotes.filter((p) => p.quantidadeRestante > 0)

  async function handleBuscar(event) {
    event.preventDefault()
    setErro('')
    setMensagemSucesso('')
    setDestinatario(null)
    setBuscando(true)

    try {
      const { data } = await api.get('/Clientes/buscar', { params: { email } })
      setDestinatario(data)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setBuscando(false)
    }
  }

  async function handleDoar(faixaValor, pacoteCorridasId, chaveBotao) {
    setDoando(chaveBotao)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Carteiras/doar', {
        emailDestinatario: destinatario.email,
        faixa: faixaValor,
        pacoteCorridasId: pacoteCorridasId ?? null,
      })

      const faixa = obterFaixa(faixaValor)
      const origem = pacoteCorridasId
        ? `Restaram ${data.quantidadeRestantePacote} corrida(s) nesse pacote.`
        : `Saldo restante na carteira: ${formatarPreco(data.saldoRestante)}.`

      setMensagemSucesso(`Corrida ${faixa.nome} doada pra ${data.nomeDestinatario}! ${origem}`)
      setDestinatario(null)
      setEmail('')
      carregarCarteira()
      carregarMeusPacotes()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setDoando(null)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Doar corrida">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Doe uma corrida pra outra pessoa — pagando com o saldo da sua carteira ou usando uma corrida
          de um pacote que você já tem.
        </p>
        {carteira && (
          <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
            Seu saldo atual: {formatarPreco(carteira.saldo)}
          </p>
        )}

        {mensagemSucesso && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {mensagemSucesso}
          </div>
        )}

        {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}

        <form onSubmit={handleBuscar} className="mb-6 flex gap-2 rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail de quem vai receber"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={buscando}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {destinatario && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
                Doar pra <span className="font-semibold">{destinatario.nome}</span> ({destinatario.email})
                usando o <span className="font-semibold">saldo da carteira</span>:
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {catalogo.map((item) => {
                  const faixa = obterFaixa(item.faixa)
                  const chave = `carteira-${item.faixa}`
                  return (
                    <button
                      key={chave}
                      type="button"
                      disabled={doando !== null}
                      onClick={() => handleDoar(item.faixa, null, chave)}
                      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition disabled:opacity-50 ${faixa.badge} ${faixa.texto} hover:brightness-95`}
                    >
                      <span className="text-sm font-semibold">{faixa.nome}</span>
                      <span className="text-xs opacity-90">
                        {doando === chave ? 'Doando...' : formatarPreco(item.precoAvulso)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {pacotesDisponiveis.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
                  Ou doar <span className="font-semibold">de um pacote que você já tem</span> (não cobra
                  de novo, só usa 1 corrida do pacote):
                </p>

                <div className="flex flex-col gap-2">
                  {pacotesDisponiveis.map((pacote) => {
                    const faixa = obterFaixa(pacote.faixa)
                    const chave = `pacote-${pacote.id}`
                    return (
                      <div
                        key={pacote.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${faixa.badge}`} />
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {faixa.nome} — {pacote.quantidadeRestante} corrida(s) restante(s)
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={doando !== null}
                          onClick={() => handleDoar(pacote.faixa, pacote.id, chave)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          {doando === chave ? 'Doando...' : 'Doar deste pacote'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
