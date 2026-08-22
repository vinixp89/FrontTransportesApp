import { useEffect, useRef, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'

export const enderecoVazio = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

// Monta um texto de exibição a partir de um endereço já resolvido — usado só pra reabrir o campo
// já preenchido quando o usuário volta pra tela de formulário (ex: clicou em "Voltar" na confirmação).
function montarTextoInicial(valores) {
  if (!valores?.logradouro) return ''

  const rua = valores.numero ? `${valores.logradouro}, ${valores.numero}` : valores.logradouro
  const partes = [rua, valores.bairro, valores.cidade && valores.estado ? `${valores.cidade}/${valores.estado}` : valores.cidade]

  return partes.filter(Boolean).join(' - ')
}

// Campo único de endereço (origem/destino) com autocomplete via API do Google (proxiada pelo nosso
// backend, que guarda a chave) — o usuário digita e escolhe da lista, e a gente já preenche
// logradouro/número/bairro/cidade/estado sozinho a partir da sugestão escolhida.
export default function EnderecoFields({ titulo, valores, onChange }) {
  const [texto, setTexto] = useState(() => montarTextoInicial(valores))
  const [sugestoes, setSugestoes] = useState([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [resolvido, setResolvido] = useState(() => Boolean(valores?.logradouro))
  const [erro, setErro] = useState('')

  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function aoClicarFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMostrarLista(false)
      }
    }

    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function handleDigitar(novoTexto) {
    setTexto(novoTexto)
    setErro('')

    // Editou depois de já ter escolhido um endereço da lista — invalida a seleção anterior até
    // escolher de novo (não dá pra saber se o texto novo ainda corresponde ao endereço resolvido).
    if (resolvido) {
      setResolvido(false)
      onChange({ ...enderecoVazio })
    }

    clearTimeout(debounceRef.current)

    if (novoTexto.trim().length < 3) {
      setSugestoes([])
      setMostrarLista(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true)

      try {
        const { data } = await api.get('/Enderecos/autocompletar', { params: { texto: novoTexto } })
        setSugestoes(data)
        setMostrarLista(true)
      } catch (error) {
        setErro(extrairMensagemErro(error))
      } finally {
        setBuscando(false)
      }
    }, 350)
  }

  async function handleSelecionar(sugestao) {
    setMostrarLista(false)
    setTexto(sugestao.descricao)
    setBuscando(true)
    setErro('')

    try {
      const { data } = await api.get('/Enderecos/detalhes', { params: { placeId: sugestao.placeId } })
      onChange({
        logradouro: data.logradouro,
        numero: data.numero || 'S/N',
        complemento: '',
        bairro: data.bairro || '',
        cidade: data.cidade,
        estado: data.estado,
      })
      setResolvido(true)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setResolvido(false)
    } finally {
      setBuscando(false)
    }
  }

  function handleLimpar() {
    setTexto('')
    setSugestoes([])
    setMostrarLista(false)
    setResolvido(false)
    setErro('')
    onChange({ ...enderecoVazio })
  }

  return (
    <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-gray-600">
      <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">{titulo}</legend>

      <div className="relative" ref={containerRef}>
        <input
          type="text"
          required
          value={texto}
          onChange={(e) => handleDigitar(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setMostrarLista(true)}
          placeholder="Digite o endereço..."
          className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 ${
            resolvido
              ? 'border-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-500'
              : 'border-gray-300 focus:border-green-500 focus:ring-green-500 dark:border-gray-600'
          }`}
        />

        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm">
          {buscando && <span className="text-gray-300 dark:text-gray-500">⏳</span>}
          {!buscando && resolvido && <span className="text-green-600 dark:text-green-400">✓</span>}
          {!buscando && !resolvido && texto && (
            <button
              type="button"
              onClick={handleLimpar}
              className="pointer-events-auto text-gray-300 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </span>

        {mostrarLista && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {sugestoes.length === 0 && !buscando && (
              <p className="px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500">Nenhum endereço encontrado.</p>
            )}
            {sugestoes.map((sugestao) => (
              <button
                key={sugestao.placeId}
                type="button"
                onClick={() => handleSelecionar(sugestao)}
                className="block w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {sugestao.descricao}
              </button>
            ))}
          </div>
        )}
      </div>

      {erro && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{erro}</p>}
      {!erro && texto && !resolvido && !mostrarLista && !buscando && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Escolha um endereço da lista pra confirmar.</p>
      )}
    </fieldset>
  )
}
