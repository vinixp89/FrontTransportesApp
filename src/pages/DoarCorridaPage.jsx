import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// Doar uma corrida pra outro cliente: busca o destinatário por e-mail exato (nunca por nome, pra não
// virar uma lista pesquisável de clientes — ver ClientesController.Buscar) e, uma vez achado, escolhe
// a faixa — o valor sai da carteira de quem doa (mesma tabela de preço avulso), sem precisar que
// nenhum dos dois já tenha pacote comprado (ver DoacaoService.DoarAsync).
export default function DoarCorridaPage() {
  const [catalogo, setCatalogo] = useState([])
  const [carteira, setCarteira] = useState(null)

  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [destinatario, setDestinatario] = useState(null)
  const [doandoFaixa, setDoandoFaixa] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api.get('/PacotesCorridas/catalogo').then(({ data }) => setCatalogo(data))
    carregarCarteira()
  }, [])

  function carregarCarteira() {
    return api.get('/Carteiras/minha-carteira').then(({ data }) => setCarteira(data))
  }

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

  async function handleDoar(faixaValor) {
    setDoandoFaixa(faixaValor)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Carteiras/doar', {
        emailDestinatario: destinatario.email,
        faixa: faixaValor,
      })

      const faixa = obterFaixa(faixaValor)
      setMensagemSucesso(
        `Corrida ${faixa.nome} doada pra ${data.nomeDestinatario}! Saldo restante: ${formatarPreco(data.saldoRestante)}.`
      )
      setDestinatario(null)
      setEmail('')
      carregarCarteira()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setDoandoFaixa(null)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Doar corrida">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Doe uma corrida pra outra pessoa — o valor sai da sua carteira, ela recebe pronta pra usar.
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
          <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              Doar corrida pra <span className="font-semibold">{destinatario.nome}</span> ({destinatario.email}) —
              escolha a faixa:
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {catalogo.map((item) => {
                const faixa = obterFaixa(item.faixa)
                return (
                  <button
                    key={item.faixa}
                    type="button"
                    disabled={doandoFaixa !== null}
                    onClick={() => handleDoar(item.faixa)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition disabled:opacity-50 ${faixa.badge} ${faixa.texto} hover:brightness-95`}
                  >
                    <span className="text-sm font-semibold">{faixa.nome}</span>
                    <span className="text-xs opacity-90">
                      {doandoFaixa === item.faixa ? 'Doando...' : formatarPreco(item.precoAvulso)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
