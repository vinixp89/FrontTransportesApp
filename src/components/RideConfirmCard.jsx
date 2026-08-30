import RideMap from './RideMap'
import { obterFaixa, formatarPreco, formatarDuracao } from '../constants/faixas'
import { useTheme } from '../context/ThemeContext'

// Cartão de confirmação/status da corrida — selo colorido por faixa, endereços, mapa e valor,
// inspirado no layout que o motorista vê pra aceitar corridas (mesma linguagem visual, adaptada
// aqui pra uma corrida só, do lado do cliente). Respeita o tema claro/escuro escolhido pelo usuário.
export default function RideConfirmCard({
  estimativa,
  modo, // 'confirmando' | 'confirmado'
  onConfirmar,
  onCancelar,
  confirmando,
  erro,
  bloqueado = false,
  gratisPlano = false,
}) {
  const { tema } = useTheme()
  const escuro = tema === 'dark'

  const faixa = obterFaixa(estimativa.faixa)
  const duracao = formatarDuracao(estimativa.duracaoEstimadaMinutos)

  const cores = escuro
    ? {
        fundo: 'bg-gray-950',
        texto: 'text-white',
        subtexto: 'text-gray-400',
        endereco: 'text-gray-200',
        linhaPontilhada: 'border-gray-700',
        botaoVoltar: 'border-gray-700 text-gray-300 hover:bg-gray-900',
        statusFundo: 'bg-gray-900 text-gray-300',
      }
    : {
        fundo: 'bg-white',
        texto: 'text-gray-900',
        subtexto: 'text-gray-500',
        endereco: 'text-gray-700',
        linhaPontilhada: 'border-gray-300',
        botaoVoltar: 'border-gray-300 text-gray-600 hover:bg-gray-50',
        statusFundo: 'bg-gray-100 text-gray-600',
      }

  return (
    <div
      className={`overflow-hidden rounded-2xl shadow-xl ${cores.fundo} ${cores.texto}`}
      style={{ borderLeft: `4px solid ${faixa.hex}` }}
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${faixa.badge} ${faixa.texto}`}
          >
            {faixa.nome}
          </span>
          {estimativa.categoria === 1 && (
            <span className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white dark:bg-white dark:text-gray-900">
              Black
            </span>
          )}
        </div>
        <span className={`text-xs ${cores.subtexto}`}>
          {modo === 'confirmado' ? 'Solicitada' : 'Confira antes de confirmar'}
        </span>
      </div>

      <div className="space-y-2 px-5 pt-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400" />
          <p className={`text-sm ${cores.endereco}`}>
            {estimativa.origem.logradouro}, {estimativa.origem.numero} — {estimativa.origem.bairro}, {estimativa.origem.cidade}
          </p>
        </div>
        <div className={`ml-[4px] h-3 w-px border-l border-dashed ${cores.linhaPontilhada}`} />
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: faixa.hex }}
          />
          <p className={`text-sm ${cores.endereco}`}>
            {estimativa.destino.logradouro}, {estimativa.destino.numero} — {estimativa.destino.bairro}, {estimativa.destino.cidade}
          </p>
        </div>
      </div>

      <div className="mt-4 px-5">
        <RideMap origem={estimativa.origem} destino={estimativa.destino} corHex={faixa.hex} />
      </div>

      <div className="mt-4 flex items-center justify-between px-5">
        <div className={`text-sm ${cores.subtexto}`}>
          {estimativa.distanciaEstimadaKm.toFixed(1)} km
          {duracao ? ` · ${duracao}` : ''}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: faixa.hex }}>
            {gratisPlano ? 'Grátis' : formatarPreco(estimativa.valorReferencia)}
          </div>
          {gratisPlano && (
            <div className={`text-xs ${cores.subtexto}`}>Benefício do plano</div>
          )}
        </div>
      </div>

      {estimativa.avisosEndereco && estimativa.avisosEndereco.length > 0 && (
        <div className="mx-5 mt-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600">
          {estimativa.avisosEndereco.map((aviso, i) => (
            <p key={i}>⚠️ {aviso}</p>
          ))}
        </div>
      )}

      {erro && (
        <div className="mx-5 mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</div>
      )}

      <div className="mt-5 px-5 pb-5">
        {modo === 'confirmando' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium ${cores.botaoVoltar}`}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando || bloqueado}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: faixa.hex }}
            >
              {confirmando ? 'Confirmando...' : 'Confirmar corrida'}
            </button>
          </div>
        ) : (
          <p className={`rounded-lg px-3 py-2.5 text-center text-sm ${cores.statusFundo}`}>
            Corrida solicitada — aguardando motorista aceitar.
          </p>
        )}
      </div>
    </div>
  )
}
