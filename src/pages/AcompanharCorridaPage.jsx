import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import RideMap from '../components/RideMap'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { obterStatusLabel } from '../constants/statusCorrida'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// Status em que ainda faz sentido continuar consultando (StatusCorrida, ver statusCorrida.js) —
// Finalizada (4) e Cancelada (5) são estados finais, aí para de perguntar pro backend.
const STATUS_FINAIS = [4, 5]
// Status com motorista já atribuído — só aí existe localização pra buscar (ver
// CorridasController.ObterLocalizacaoMotorista no backend).
const STATUS_COM_MOTORISTA = [1, 2, 3]
// Confirmada (motorista aceitou, ainda não iniciou) — só nesse status o código de confirmação
// ainda é útil de mostrar (depois de EmAndamento ele já cumpriu o papel dele).
const STATUS_CONFIRMADA = 1
const INTERVALO_MS = 4000

// Tela de acompanhar a corrida depois de confirmada: consulta o status periodicamente e, assim
// que o motorista aceita, passa a mostrar ele se deslocando no mapa (via GET
// /Corridas/{id}/localizacao-motorista, também em polling).
export default function AcompanharCorridaPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [corrida, setCorrida] = useState(null)
  const [motorista, setMotorista] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const intervaloRef = useRef(null)

  const buscar = useCallback(async () => {
    try {
      const { data } = await api.get(`/Corridas/${id}`)
      setCorrida(data)

      // Só busca uma vez (assim que confirma) — não precisa ficar repetindo a cada polling.
      if (data.status === STATUS_CONFIRMADA && !codigo) {
        try {
          const { data: resposta } = await api.get(`/Corridas/${id}/codigo-confirmacao`)
          setCodigo(resposta.codigo)
        } catch {
          // Sem sorte agora — tenta de novo no próximo polling.
        }
      }

      if (STATUS_COM_MOTORISTA.includes(data.status)) {
        try {
          const { data: local } = await api.get(`/Corridas/${id}/localizacao-motorista`)
          setMotorista(local)
        } catch {
          // Sem sorte agora — mantém a última posição conhecida na tela em vez de sumir com o marcador.
        }
      } else {
        setMotorista(null)
      }

      if (STATUS_FINAIS.includes(data.status) && intervaloRef.current) {
        clearInterval(intervaloRef.current)
        intervaloRef.current = null
      }
    } catch (error) {
      setErro(extrairMensagemErro(error))
    }
  }, [id, codigo])

  useEffect(() => {
    buscar()
    intervaloRef.current = setInterval(buscar, INTERVALO_MS)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [buscar])

  async function handleCancelar() {
    setCancelando(true)
    setErro('')

    try {
      const { data } = await api.patch(`/Corridas/${id}/cancelar`)
      setCorrida(data)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCancelando(false)
    }
  }

  if (!corrida) {
    return (
      <div className="min-h-screen pb-16">
        <AppNavbar titulo="Acompanhar corrida">
          <ThemeToggleButton />
        </AppNavbar>
        <main className="mx-auto mt-8 max-w-2xl px-4">
          {erro ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
          )}
        </main>
      </div>
    )
  }

  const faixa = obterFaixa(corrida.faixaContratada)
  const status = obterStatusLabel(corrida.status)
  const podeCancelar = corrida.status === 0 || corrida.status === 1
  const motoristaPos = motorista && motorista.latitude != null && motorista.longitude != null
    ? [motorista.latitude, motorista.longitude]
    : null

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Acompanhar corrida">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <div
          className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-950"
          style={{ borderLeft: `4px solid ${faixa.hex}` }}
        >
          <div className="flex items-center justify-between px-5 pt-5">
            <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${faixa.badge} ${faixa.texto}`}>
              {faixa.nome}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.cor}`}>
              {status.texto}
            </span>
          </div>

          {codigo && corrida.status === STATUS_CONFIRMADA && (
            <div className="mx-5 mt-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 px-4 py-3 text-center dark:border-purple-800 dark:bg-purple-950">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Fale esse código pro motorista antes dele iniciar a viagem
              </p>
              <p className="mt-1 text-3xl font-bold tracking-[0.4em] text-purple-800 dark:text-purple-200">
                {codigo}
              </p>
            </div>
          )}

          <div className="space-y-2 px-5 pt-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400" />
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {corrida.origem.logradouro}, {corrida.origem.numero} — {corrida.origem.bairro}
              </p>
            </div>
            <div className="ml-[4px] h-3 w-px border-l border-dashed border-gray-300 dark:border-gray-700" />
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: faixa.hex }} />
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {corrida.destino.logradouro}, {corrida.destino.numero} — {corrida.destino.bairro}
              </p>
            </div>
          </div>

          <div className="mt-4 px-5">
            <RideMap origem={corrida.origem} destino={corrida.destino} corHex={faixa.hex} motoristaPos={motoristaPos} />
          </div>

          <div className="mt-4 flex items-center justify-between px-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {corrida.distanciaEstimadaKm.toFixed(1)} km
            </div>
            <div className="text-lg font-bold" style={{ color: faixa.hex }}>
              {formatarPreco(corrida.valorReferencia)}
            </div>
          </div>

          {motorista && (
            <div className="mx-5 mt-4 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              Motorista a caminho — {motorista.modeloVeiculo} ({motorista.placaVeiculo})
            </div>
          )}

          {erro && (
            <div className="mx-5 mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</div>
          )}

          <div className="mt-5 flex gap-3 px-5 pb-5">
            {podeCancelar && (
              <button
                type="button"
                onClick={handleCancelar}
                disabled={cancelando}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {cancelando ? 'Cancelando...' : 'Cancelar corrida'}
              </button>
            )}

            {(corrida.status === 4 || corrida.status === 5) && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition"
                style={{ backgroundColor: faixa.hex }}
              >
                Voltar pro início
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
