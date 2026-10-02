import { useCallback, useEffect, useRef, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const TIPO_LABEL = { 0: 'Cliente', 1: 'Motorista' }
const INTERVALO_MS = 5000

function tempoDecorrido(dataIso) {
  const minutos = Math.floor((Date.now() - new Date(dataIso).getTime()) / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} dia${dias === 1 ? '' : 's'}`
}

function ConversaItem({ conversa, selecionada, onSelecionar }) {
  return (
    <button
      type="button"
      onClick={() => onSelecionar(conversa.usuarioId)}
      className={`w-full rounded-xl p-3 text-left transition ${
        selecionada
          ? 'bg-gray-800 text-white'
          : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${selecionada ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
          {conversa.nomeUsuario}
        </p>
        {conversa.pendenteResposta && (
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" title="Pendente de resposta" />
        )}
      </div>
      <p className={`text-xs ${selecionada ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
        {TIPO_LABEL[conversa.tipoUsuario]} · {tempoDecorrido(conversa.ultimaData)}
      </p>
      <p className={`mt-1 truncate text-xs ${selecionada ? 'text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
        {conversa.ultimoTexto}
      </p>
    </button>
  )
}

function ConversaThread({ usuarioId, nomeUsuario, onRespondida }) {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const ultimaDataRef = useRef(null)
  const listaRef = useRef(null)

  const buscar = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/suporte/conversas/${usuarioId}/mensagens`, {
        params: ultimaDataRef.current ? { desde: ultimaDataRef.current } : undefined,
      })

      if (data.length > 0) {
        setMensagens((atual) => [...atual, ...data])
        ultimaDataRef.current = data[data.length - 1].dataEnvio
        setTimeout(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight }), 50)
      }
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCarregando(false)
    }
  }, [usuarioId])

  useEffect(() => {
    setMensagens([])
    ultimaDataRef.current = null
    setCarregando(true)
    buscar()
    const intervalo = setInterval(buscar, INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [buscar])

  async function handleEnviar(e) {
    e.preventDefault()
    const textoLimpo = texto.trim()
    if (!textoLimpo) return

    setEnviando(true)
    setErro('')

    try {
      const { data } = await api.post(`/admin/suporte/conversas/${usuarioId}/responder`, { texto: textoLimpo })
      setMensagens((atual) => [...atual, data])
      ultimaDataRef.current = data.dataEnvio
      setTexto('')
      onRespondida(usuarioId)
      setTimeout(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight }), 50)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl bg-white shadow dark:bg-gray-800">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{nomeUsuario}</p>
      </div>

      <div ref={listaRef} className="flex-1 overflow-y-auto px-4 py-3">
        {carregando && <p className="text-sm text-gray-400">Carregando...</p>}

        {!carregando && mensagens.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
        )}

        <div className="flex flex-col gap-2">
          {mensagens.map((m) => (
            <div key={m.id} className={`flex ${m.enviadaPeloAdmin ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.enviadaPeloAdmin
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                }`}
              >
                <p>{m.texto}</p>
                <p className={`mt-1 text-right text-[10px] ${m.enviadaPeloAdmin ? 'text-gray-300' : 'text-gray-400'}`}>
                  {new Date(m.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {erro && (
        <p className="px-4 pb-1 text-xs text-red-600 dark:text-red-400">{erro}</p>
      )}

      <form onSubmit={handleEnviar} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma resposta"
          maxLength={500}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

// Fila de conversas de suporte (ver AdminSuporteController) — Cliente/Motorista manda mensagem
// pelo app, aqui o Admin vê todas as conversas e responde qualquer uma. Lista de conversas
// atualiza por polling, igual o chat de corrida já faz no app.
export default function AdminSuportePage() {
  const [conversas, setConversas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)

  const carregarConversas = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/suporte/conversas')
      setConversas(data)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarConversas()
    const intervalo = setInterval(carregarConversas, INTERVALO_MS)
    return () => clearInterval(intervalo)
  }, [carregarConversas])

  function handleRespondida(usuarioId) {
    setConversas((atual) =>
      atual.map((c) => (c.usuarioId === usuarioId ? { ...c, pendenteResposta: false } : c))
    )
  }

  const conversaSelecionada = conversas.find((c) => c.usuarioId === usuarioSelecionado)

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — suporte">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-5xl px-4">
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && conversas.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa de suporte ainda.</p>
          </div>
        )}

        {conversas.length > 0 && (
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
              {conversas.map((conversa) => (
                <ConversaItem
                  key={conversa.usuarioId}
                  conversa={conversa}
                  selecionada={conversa.usuarioId === usuarioSelecionado}
                  onSelecionar={setUsuarioSelecionado}
                />
              ))}
            </div>

            {conversaSelecionada ? (
              <ConversaThread
                usuarioId={conversaSelecionada.usuarioId}
                nomeUsuario={conversaSelecionada.nomeUsuario}
                onRespondida={handleRespondida}
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-white shadow dark:bg-gray-800">
                <p className="text-sm text-gray-400">Selecione uma conversa à esquerda.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
