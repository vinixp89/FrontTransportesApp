import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'

// Espelha TipoUsuario do backend (TransportesApp.Domain/Enums/Enums.cs) — mesma convenção do
// RemetenteTipo do chat.
export const TIPO_USUARIO = { CLIENTE: 0, MOTORISTA: 1 }

// Avaliação de 1 a 5 estrelas + comentário opcional, usada tanto pelo Cliente avaliando o Motorista
// (AcompanharCorridaPage) quanto pelo Motorista avaliando o Cliente (CorridasMotoristaPage) — só
// muda o texto e pra quem manda (autorTipoAtual decide, ver GET {id}/avaliacoes no backend). Confere
// sozinho se essa corrida já foi avaliada por esse lado antes de mostrar o formulário.
export default function AvaliacaoForm({ corridaId, autorTipoAtual, titulo, corDestaque = '#7c3aed' }) {
  const [carregando, setCarregando] = useState(true)
  const [jaAvaliada, setJaAvaliada] = useState(false)
  const [nota, setNota] = useState(0)
  const [notaHover, setNotaHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false

    api
      .get(`/Corridas/${corridaId}/avaliacoes`)
      .then(({ data }) => {
        if (cancelado) return
        setJaAvaliada(data.some((a) => a.autorTipo === autorTipoAtual))
      })
      .catch(() => {})
      .finally(() => !cancelado && setCarregando(false))

    return () => { cancelado = true }
  }, [corridaId, autorTipoAtual])

  async function handleEnviar(event) {
    event.preventDefault()

    if (nota === 0) {
      setErro('Escolha de 1 a 5 estrelas.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      await api.post(`/Corridas/${corridaId}/avaliar`, { nota, comentario: comentario.trim() || null })
      setJaAvaliada(true)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return null

  if (jaAvaliada) {
    return (
      <div className="rounded-lg bg-gray-100 px-3 py-2.5 text-center text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        Obrigado pela avaliação! ⭐
      </div>
    )
  }

  return (
    <form onSubmit={handleEnviar} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{titulo}</p>

      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setNota(valor)}
            onMouseEnter={() => setNotaHover(valor)}
            onMouseLeave={() => setNotaHover(0)}
            aria-label={`${valor} estrela${valor === 1 ? '' : 's'}`}
            className="text-3xl leading-none transition"
            style={{ color: valor <= (notaHover || nota) ? corDestaque : undefined }}
          >
            <span className={valor <= (notaHover || nota) ? '' : 'text-gray-300 dark:text-gray-600'}>★</span>
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentário (opcional)"
        rows={2}
        maxLength={500}
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />

      {erro && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition disabled:opacity-60"
        style={{ backgroundColor: corDestaque }}
      >
        {enviando ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </form>
  )
}
