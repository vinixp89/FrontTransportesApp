import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// Fotos de verificação do motorista exigem o token JWT no header (não dá pra usar <img src=".../foto">
// direto), então busca como blob autenticado e vira uma object URL só pra essa foto.
function FotoMotorista({ motoristaId, tipo, label, disponivel }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!disponivel) return

    let objectUrl
    let cancelado = false

    api
      .get(`/admin/executivo/motoristas/${motoristaId}/foto-${tipo}`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelado) return
        objectUrl = URL.createObjectURL(data)
        setUrl(objectUrl)
      })
      .catch(() => !cancelado && setErro(true))

    return () => {
      cancelado = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [motoristaId, tipo, disponivel])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        {!disponivel && <span className="text-xs text-gray-400 dark:text-gray-500">Sem foto</span>}
        {disponivel && !url && !erro && <span className="text-xs text-gray-400 dark:text-gray-500">Carregando...</span>}
        {disponivel && erro && <span className="text-xs text-red-400">Falha ao carregar</span>}
        {disponivel && url && (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} className="h-32 w-44 object-cover" />
          </a>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

function SolicitacaoCard({ solicitacao, onResolver }) {
  const [processando, setProcessando] = useState(false)
  const [negando, setNegando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  async function aprovar() {
    setProcessando(true)
    setErro('')

    try {
      await api.post(`/admin/executivo/${solicitacao.assinaturaId}/aprovar`)
      onResolver(solicitacao.assinaturaId)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setProcessando(false)
    }
  }

  async function confirmarNegar() {
    if (!motivo.trim()) {
      setErro('Informe o motivo da negativa.')
      return
    }

    setProcessando(true)
    setErro('')

    try {
      await api.post(`/admin/executivo/${solicitacao.assinaturaId}/negar`, { motivo: motivo.trim() })
      onResolver(solicitacao.assinaturaId)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setProcessando(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{solicitacao.modeloVeiculo}</p>
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{solicitacao.placaVeiculo}</p>
        </div>
        <div className="text-right text-xs text-gray-400 dark:text-gray-500">
          <p>Ano declarado: {solicitacao.anoVeiculo ?? '—'}</p>
          <p>{new Date(solicitacao.dataSolicitacao).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <FotoMotorista
          motoristaId={solicitacao.motoristaId}
          tipo="veiculo"
          label="Foto do veículo"
          disponivel={solicitacao.temFotoVeiculo}
        />
        <FotoMotorista
          motoristaId={solicitacao.motoristaId}
          tipo="placa"
          label="Foto da placa"
          disponivel={solicitacao.temFotoPlaca}
        />
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
      )}

      {!negando ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={aprovar}
            disabled={processando}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {processando ? 'Aprovando...' : 'Aprovar'}
          </button>
          <button
            type="button"
            onClick={() => setNegando(true)}
            disabled={processando}
            className="flex-1 rounded-lg border border-red-500 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Negar
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da negativa (o motorista vai ver esse texto)"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmarNegar}
              disabled={processando}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {processando ? 'Enviando...' : 'Confirmar negativa'}
            </button>
            <button
              type="button"
              onClick={() => { setNegando(false); setErro('') }}
              disabled={processando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fila de revisão manual antes de qualquer cobrança da categoria Executivo — placa/modelo/ano são
// autodeclarados pelo motorista no app (ver Motorista.VeiculoElegivelParaExecutivo no backend), então
// aqui o Admin confere a foto real do carro/placa antes de aprovar (ver AdminExecutivoController).
export default function AdminExecutivoPage() {
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setCarregando(true)
    api
      .get('/admin/executivo/pendentes')
      .then(({ data }) => setPendentes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }

  function handleResolver(assinaturaId) {
    setPendentes((atual) => atual.filter((s) => s.assinaturaId !== assinaturaId))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — aprovação Executivo">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-3xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pendentes.length} solicitaç{pendentes.length === 1 ? 'ão' : 'ões'} aguardando revisão
          </p>
          <button
            type="button"
            onClick={carregar}
            className="text-xs text-gray-400 hover:text-gray-600 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
          >
            Atualizar
          </button>
        </div>

        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && pendentes.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma solicitação aguardando aprovação.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {pendentes.map((solicitacao) => (
            <SolicitacaoCard key={solicitacao.assinaturaId} solicitacao={solicitacao} onResolver={handleResolver} />
          ))}
        </div>
      </main>
    </div>
  )
}
