import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const VALORES_RAPIDOS = [20, 50, 100]

export default function CarteiraPage() {
  const [carteira, setCarteira] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [valor, setValor] = useState('')
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  function carregarCarteira() {
    return api
      .get('/Carteiras/minha-carteira')
      .then(({ data }) => setCarteira(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
  }

  useEffect(() => {
    carregarCarteira().finally(() => setCarregando(false))
  }, [])

  async function handleRecarregar(event) {
    event.preventDefault()
    setErro('')
    setMensagemSucesso('')

    const valorNumerico = Number(valor.replace(',', '.'))

    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Informe um valor válido pra recarga.')
      return
    }

    setRecarregando(true)

    try {
      const { data } = await api.post('/Carteiras/recarregar', { valor: valorNumerico })
      setCarteira(data)
      setValor('')
      setMensagemSucesso(`Recarga de ${formatarPreco(valorNumerico)} feita com sucesso!`)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setRecarregando(false)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Saldo em reais">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-md px-4">
        <div className="mb-6 rounded-2xl bg-green-600 p-6 text-white shadow-lg dark:bg-green-700">
          <p className="text-sm text-green-100">Saldo disponível</p>
          <p className="text-3xl font-bold">
            {carregando ? '...' : formatarPreco(carteira?.saldo ?? 0)}
          </p>
        </div>

        <form onSubmit={handleRecarregar} className="rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Recarregar saldo</h2>

          <div className="mb-4 flex gap-2">
            {VALORES_RAPIDOS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValor(String(v))}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  valor === String(v)
                    ? 'border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950 dark:text-green-300'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                R$ {v}
              </button>
            ))}
          </div>

          <label htmlFor="valor" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ou informe outro valor
          </label>
          <input
            id="valor"
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          />

          {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}
          {mensagemSucesso && (
            <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{mensagemSucesso}</p>
          )}

          <button
            type="submit"
            disabled={recarregando}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {recarregando ? 'Recarregando...' : 'Recarregar'}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          Por enquanto a recarga só adiciona saldo — usar o saldo pra pagar corridas ainda não está
          disponível.
        </p>

        <Link to="/extrato" className="mt-4 block text-center text-sm text-green-600 hover:underline dark:text-green-400">
          Ver extrato completo →
        </Link>
      </main>
    </div>
  )
}
