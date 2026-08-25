import { useCallback, useEffect, useRef, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { obterStatusLabel } from '../constants/statusCorrida'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const INTERVALO_MS = 5000

// Tela do motorista pra aceitar corridas pendentes e, depois de aceitar, tocar a viagem
// (iniciar/finalizar). Enquanto não tem corrida aceita, mostra a lista de pendentes; assim que
// aceita, troca pro painel da corrida atual — nunca as duas coisas ao mesmo tempo, porque aceitar
// uma corrida deixa o motorista EmCorrida no backend (não dá pra aceitar outra até finalizar).
export default function CorridasMotoristaPage() {
  const [corridaAtual, setCorridaAtual] = useState(null)
  const [pendentes, setPendentes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aceitandoId, setAceitandoId] = useState(null)
  const [iniciando, setIniciando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [distanciaReal, setDistanciaReal] = useState('')
  const [codigo, setCodigo] = useState('')
  const intervaloRef = useRef(null)

  const buscar = useCallback(async () => {
    try {
      const { data: atual } = await api.get('/Corridas/atual')
      setCorridaAtual(atual)

      if (!atual) {
        const { data: lista } = await api.get('/Corridas/pendentes')
        setPendentes(lista)
      }
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    buscar()
    intervaloRef.current = setInterval(buscar, INTERVALO_MS)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [buscar])

  useEffect(() => {
    if (corridaAtual) {
      setDistanciaReal(String(corridaAtual.distanciaEstimadaKm.toFixed(1)))
      setCodigo('')
    }
  }, [corridaAtual?.id])

  async function handleAceitar(id) {
    setAceitandoId(id)
    setErro('')

    try {
      const { data } = await api.patch(`/Corridas/${id}/atribuir-motorista`)
      setCorridaAtual(data)
      setPendentes([])
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setAceitandoId(null)
    }
  }

  async function handleIniciar(event) {
    event.preventDefault()
    setIniciando(true)
    setErro('')

    try {
      const { data } = await api.patch(`/Corridas/${corridaAtual.id}/iniciar`, { codigo })
      setCorridaAtual(data)
      setCodigo('')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setIniciando(false)
    }
  }

  async function handleFinalizar(event) {
    event.preventDefault()
    setFinalizando(true)
    setErro('')

    try {
      await api.patch(`/Corridas/${corridaAtual.id}/finalizar`, {
        distanciaReal: Number(distanciaReal),
      })
      setCorridaAtual(null)
      buscar()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-16 dark:bg-purple-950">
      <AppNavbar titulo="Corridas">
        <ThemeToggleButton variant="purple" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && corridaAtual && (
          <CorridaAtualPainel
            corrida={corridaAtual}
            iniciando={iniciando}
            finalizando={finalizando}
            distanciaReal={distanciaReal}
            codigo={codigo}
            onCodigoChange={setCodigo}
            onDistanciaChange={setDistanciaReal}
            onIniciar={handleIniciar}
            onFinalizar={handleFinalizar}
          />
        )}

        {!carregando && !corridaAtual && (
          <>
            {pendentes.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma corrida esperando motorista no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.map((c) => {
                  const faixa = obterFaixa(c.faixaContratada)

                  return (
                    <div
                      key={c.id}
                      className="overflow-hidden rounded-2xl bg-white p-5 shadow dark:bg-gray-800"
                      style={{ borderLeft: `4px solid ${faixa.hex}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${faixa.badge} ${faixa.texto}`}>
                          {faixa.nome}
                        </span>
                        <span className="text-lg font-bold" style={{ color: faixa.hex }}>
                          {formatarPreco(c.valorReferencia)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                        {c.origem.bairro} → {c.destino.bairro}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {c.distanciaEstimadaKm.toFixed(1)} km
                      </p>

                      <button
                        type="button"
                        onClick={() => handleAceitar(c.id)}
                        disabled={aceitandoId !== null}
                        className="mt-4 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
                      >
                        {aceitandoId === c.id ? 'Aceitando...' : 'Aceitar corrida'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// StatusCorrida: 1 Confirmada (aceita, motorista a caminho), 3 EmAndamento (viagem rolando).
const STATUS_CONFIRMADA = 1

function CorridaAtualPainel({
  corrida,
  iniciando,
  finalizando,
  distanciaReal,
  codigo,
  onCodigoChange,
  onDistanciaChange,
  onIniciar,
  onFinalizar,
}) {
  const faixa = obterFaixa(corrida.faixaContratada)
  const status = obterStatusLabel(corrida.status)

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
      style={{ borderLeft: `4px solid ${faixa.hex}` }}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${faixa.badge} ${faixa.texto}`}>
          {faixa.nome}
        </span>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.cor}`}>
          {status.texto}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400" />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {corrida.origem.logradouro}, {corrida.origem.numero} — {corrida.origem.bairro}
          </p>
        </div>
        <div className="ml-[4px] h-3 w-px border-l border-dashed border-gray-300 dark:border-gray-600" />
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: faixa.hex }} />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {corrida.destino.logradouro}, {corrida.destino.numero} — {corrida.destino.bairro}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{corrida.distanciaEstimadaKm.toFixed(1)} km estimados</span>
        <span className="text-lg font-bold" style={{ color: faixa.hex }}>{formatarPreco(corrida.valorReferencia)}</span>
      </div>

      {corrida.status === STATUS_CONFIRMADA ? (
        <form onSubmit={onIniciar} className="mt-5 space-y-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300">
            Código informado pelo cliente
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="0000"
              value={codigo}
              onChange={(e) => onCodigoChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.5em] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <button
            type="submit"
            disabled={iniciando || codigo.length !== 4}
            className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
          >
            {iniciando ? 'Iniciando...' : 'Iniciar viagem'}
          </button>
        </form>
      ) : (
        <form onSubmit={onFinalizar} className="mt-5 space-y-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300">
            Distância percorrida (km)
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={distanciaReal}
              onChange={(e) => onDistanciaChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <button
            type="submit"
            disabled={finalizando}
            className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {finalizando ? 'Finalizando...' : 'Finalizar corrida'}
          </button>
        </form>
      )}
    </div>
  )
}
