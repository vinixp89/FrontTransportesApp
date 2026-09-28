import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const TIPO_LABEL = { 0: 'Pix', 1: 'Transferência bancária' }

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

function tempoDecorrido(dataIso) {
  const minutos = Math.floor((Date.now() - new Date(dataIso).getTime()) / 60000)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} dia${dias === 1 ? '' : 's'}`
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    // Sem clipboard disponível (http, navegador antigo) — sem problema, o texto já está visível na tela.
  }
}

function DadosPagamento({ solicitacao }) {
  if (solicitacao.tipo === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Chave Pix:</span>
        <span className="font-mono text-sm text-gray-800 dark:text-gray-100">{solicitacao.chavePix}</span>
        <button
          type="button"
          onClick={() => copiar(solicitacao.chavePix)}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          copiar
        </button>
      </div>
    )
  }

  const dados = `${solicitacao.banco} · Ag. ${solicitacao.agencia} · Conta ${solicitacao.conta} (${solicitacao.tipoConta})`
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">Dados bancários:</span>
      <span className="font-mono text-sm text-gray-800 dark:text-gray-100">{dados}</span>
      <button
        type="button"
        onClick={() => copiar(dados)}
        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        copiar
      </button>
    </div>
  )
}

function SolicitacaoCard({ solicitacao, onResolver }) {
  const [confirmandoPix, setConfirmandoPix] = useState(false)
  const [confirmacaoDigitada, setConfirmacaoDigitada] = useState('')
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const ehPix = solicitacao.tipo === 0

  async function confirmarAprovar() {
    setProcessando(true)
    setErro('')
    try {
      await api.post(`/admin/saques/${solicitacao.id}/concluir`)
      onResolver(solicitacao.id)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setProcessando(false)
    }
  }

  function aprovar() {
    if (ehPix) {
      setConfirmandoPix(true)
      return
    }
    // Transferência bancária é manual (o Admin já pagou por fora antes de clicar) — não dispara
    // nenhum envio de dinheiro daqui, só registra.
    if (window.confirm(`Confirma que já transferiu ${formatarValor(solicitacao.valor)} pra ${solicitacao.motoristaNome}?`)) {
      confirmarAprovar()
    }
  }

  async function confirmarNegar() {
    if (!motivo.trim()) {
      setErro('Informe o motivo da rejeição.')
      return
    }
    setProcessando(true)
    setErro('')
    try {
      await api.post(`/admin/saques/${solicitacao.id}/rejeitar`, { motivo: motivo.trim() })
      onResolver(solicitacao.id)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setProcessando(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{solicitacao.motoristaNome}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CPF {formatarCpf(solicitacao.motoristaCpf)} · {solicitacao.motoristaTelefone}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatarValor(solicitacao.valor)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {TIPO_LABEL[solicitacao.tipo]} · {tempoDecorrido(solicitacao.dataSolicitacao)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <DadosPagamento solicitacao={solicitacao} />
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
      )}

      {confirmandoPix ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            ⚠️ Isso envia {formatarValor(solicitacao.valor)} de verdade via Pix, na hora. Não tem como desfazer.
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Pra confirmar, digita <b>CONFIRMAR</b> abaixo:
          </p>
          <input
            type="text"
            value={confirmacaoDigitada}
            onChange={(e) => setConfirmacaoDigitada(e.target.value)}
            className="mt-2 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
            placeholder="CONFIRMAR"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={confirmarAprovar}
              disabled={confirmacaoDigitada !== 'CONFIRMAR' || processando}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processando ? 'Enviando Pix...' : 'Enviar Pix agora'}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmandoPix(false); setConfirmacaoDigitada(''); setErro('') }}
              disabled={processando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : rejeitando ? (
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da rejeição (o motorista vai ver esse texto — o valor volta pro saldo dele automaticamente)"
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
              {processando ? 'Enviando...' : 'Confirmar rejeição'}
            </button>
            <button
              type="button"
              onClick={() => { setRejeitando(false); setErro('') }}
              disabled={processando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={aprovar}
            disabled={processando}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {ehPix ? 'Aprovar e enviar Pix' : 'Confirmar transferência feita'}
          </button>
          <button
            type="button"
            onClick={() => setRejeitando(true)}
            disabled={processando}
            className="flex-1 rounded-lg border border-red-500 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Rejeitar
          </button>
        </div>
      )}
    </div>
  )
}

// Fila de saques pendentes (ver AdminSaquesController) — Pix dispara pagamento real pelo Banco
// Inter na hora que o Admin aprova aqui, por isso a confirmação extra; transferência bancária é só
// o Admin registrando que já pagou por fora manualmente.
export default function AdminSaquesPage() {
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setCarregando(true)
    api
      .get('/admin/saques/pendentes')
      .then(({ data }) => setPendentes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }

  function handleResolver(id) {
    setPendentes((atual) => atual.filter((s) => s.id !== id))
  }

  const totalPendente = pendentes.reduce((soma, s) => soma + s.valor, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — saques de motoristas">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-3xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pendentes.length} solicitaç{pendentes.length === 1 ? 'ão' : 'ões'} pendente
            {pendentes.length === 1 ? '' : 's'}
            {pendentes.length > 0 && ` · total ${formatarValor(totalPendente)}`}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum saque pendente.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {pendentes.map((solicitacao) => (
            <SolicitacaoCard key={solicitacao.id} solicitacao={solicitacao} onResolver={handleResolver} />
          ))}
        </div>
      </main>
    </div>
  )
}
