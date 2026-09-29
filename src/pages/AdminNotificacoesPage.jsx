import { useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const PAPEL_LABEL = { 0: 'Clientes', 1: 'Motoristas' }

export default function AdminNotificacoesPage() {
  const [papel, setPapel] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    if (!window.confirm(`Enviar essa notificação pra todos os ${PAPEL_LABEL[papel]} com o app instalado?`)) return

    setEnviando(true)
    setErro('')
    setResultado(null)

    try {
      const { data } = await api.post('/admin/notificacoes/broadcast', {
        papel,
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
      })
      setResultado(data.totalEnviado)
      setTitulo('')
      setMensagem('')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — notificações push">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Manda uma notificação que chega mesmo com o app fechado, pra quem já abriu o app pelo
          menos uma vez com a permissão de notificação concedida.
        </p>

        <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Enviar para</label>
            <select
              value={papel}
              onChange={(e) => setPapel(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value={0}>Clientes</option>
              <option value={1}>Motoristas</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Título</label>
            <input
              type="text"
              required
              maxLength={100}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Mensagem</label>
            <textarea
              required
              maxLength={200}
              rows={3}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
          )}

          {resultado !== null && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              Enviado pra {resultado} aparelho{resultado === 1 ? '' : 's'}.
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar notificação'}
          </button>
        </form>
      </main>
    </div>
  )
}
