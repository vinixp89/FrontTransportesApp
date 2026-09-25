import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// Telas do app Cliente que não exigem parâmetro (ver RootStackParamList no mobiletransportesapp) —
// só essas fazem sentido como destino do botão do aviso, porque navigation.navigate(tela) é chamado
// sem nenhum parâmetro extra.
const TELAS_DESTINO = [
  { valor: '', label: 'Nenhuma (só fecha o aviso)' },
  { valor: 'Pacotes', label: 'Pacote de corrida' },
  { valor: 'Planos', label: 'Planos' },
  { valor: 'SaldoCorrida', label: 'Saldo de corridas' },
  { valor: 'DoarCorrida', label: 'Doar corrida' },
  { valor: 'TransportesEMudanca', label: 'Transportes e mudança' },
  { valor: 'Historico', label: 'Histórico de corridas' },
]

function paraInputDatetime(isoString) {
  // <input type="datetime-local"> espera "AAAA-MM-DDTHH:mm" em horário local, sem timezone.
  const data = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function formVazio() {
  const agora = new Date()
  const daquiA30Dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000)
  return {
    titulo: '',
    texto: '',
    corFundoHex: '#16a34a',
    textoBotao: '',
    telaDestino: '',
    dataInicio: paraInputDatetime(agora.toISOString()),
    dataFim: paraInputDatetime(daquiA30Dias.toISOString()),
    ativo: true,
  }
}

export default function AdminAvisosPage() {
  const [avisos, setAvisos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(formVazio())
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setCarregando(true)
    api
      .get('/Avisos')
      .then(({ data }) => setAvisos(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }

  function iniciarEdicao(aviso) {
    setEditandoId(aviso.id)
    setForm({
      titulo: aviso.titulo,
      texto: aviso.texto,
      corFundoHex: aviso.corFundoHex,
      textoBotao: aviso.textoBotao ?? '',
      telaDestino: aviso.telaDestino ?? '',
      dataInicio: paraInputDatetime(aviso.dataInicio),
      dataFim: paraInputDatetime(aviso.dataFim),
      ativo: aviso.ativo,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm(formVazio())
    setErro('')
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    const payload = {
      titulo: form.titulo.trim(),
      texto: form.texto.trim(),
      corFundoHex: form.corFundoHex,
      textoBotao: form.textoBotao.trim() || null,
      telaDestino: form.telaDestino || null,
      dataInicio: new Date(form.dataInicio).toISOString(),
      dataFim: new Date(form.dataFim).toISOString(),
      ativo: form.ativo,
    }

    try {
      if (editandoId) {
        await api.put(`/Avisos/${editandoId}`, payload)
      } else {
        await api.post('/Avisos', payload)
      }
      cancelarEdicao()
      carregar()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir esse aviso? Não dá pra desfazer.')) return

    try {
      await api.delete(`/Avisos/${id}`)
      setAvisos((atual) => atual.filter((a) => a.id !== id))
      if (editandoId === id) cancelarEdicao()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — avisos do app">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-3xl px-4">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          O aviso aparece como um pop-up ao abrir o app Cliente. Cada pessoa vê o mesmo aviso só uma
          vez. Se mais de um aviso estiver ativo e dentro do período ao mesmo tempo, mostra o de data
          de início mais recente.
        </p>

        <form onSubmit={salvar} className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {editandoId ? 'Editar aviso' : 'Novo aviso'}
          </h2>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Título</label>
            <input
              type="text"
              required
              maxLength={120}
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Texto</label>
            <textarea
              required
              maxLength={500}
              rows={3}
              value={form.texto}
              onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Cor de fundo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.corFundoHex}
                  onChange={(e) => setForm((f) => ({ ...f, corFundoHex: e.target.value }))}
                  className="h-9 w-12 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={form.corFundoHex}
                  onChange={(e) => setForm((f) => ({ ...f, corFundoHex: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                />
                Ativo
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Texto do botão (opcional)
              </label>
              <input
                type="text"
                maxLength={40}
                placeholder="Ex.: Ver como funciona"
                value={form.textoBotao}
                onChange={(e) => setForm((f) => ({ ...f, textoBotao: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Pra onde o botão leva
              </label>
              <select
                value={form.telaDestino}
                onChange={(e) => setForm((f) => ({ ...f, telaDestino: e.target.value }))}
                disabled={!form.textoBotao.trim()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                {TELAS_DESTINO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Início</label>
              <input
                type="datetime-local"
                required
                value={form.dataInicio}
                onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Fim</label>
              <input
                type="datetime-local"
                required
                value={form.dataFim}
                onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar aviso'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">Avisos cadastrados</h2>

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && avisos.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum aviso cadastrado ainda.</p>
        )}

        <div className="flex flex-col gap-3">
          {avisos.map((aviso) => (
            <div key={aviso.id} className="rounded-2xl bg-white p-4 shadow dark:bg-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: aviso.corFundoHex }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{aviso.titulo}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{aviso.texto}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(aviso.dataInicio).toLocaleDateString('pt-BR')} até {new Date(aviso.dataFim).toLocaleDateString('pt-BR')}
                      {' · '}
                      {aviso.ativo ? 'Ativo' : 'Desativado'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(aviso)}
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(aviso.id)}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
