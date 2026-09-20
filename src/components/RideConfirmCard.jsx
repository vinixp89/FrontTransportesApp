import RideMap from './RideMap'
import { obterFaixa, formatarPreco, formatarDuracao } from '../constants/faixas'
import { useTheme } from '../context/ThemeContext'

// Cartão de confirmação/status da corrida — selo colorido por faixa, endereços, mapa e valor,
// inspirado no layout que o motorista vê pra aceitar corridas (mesma linguagem visual, adaptada
// aqui pra uma corrida só, do lado do cliente). Respeita o tema claro/escuro escolhido pelo usuário.
const CATEGORIA = { NORMAL: 0, EXECUTIVO: 1 }

export default function RideConfirmCard({
  estimativa,
  modo, // 'confirmando' | 'confirmado'
  categoria = CATEGORIA.NORMAL,
  onCategoriaChange,
  onConfirmar,
  onCancelar,
  confirmando,
  erro,
  bloqueado = false,
  gratisPlano = false,
  // Corrida avulsa tem 2 formas de pagar (ver PedirCorridaPage) — onConfirmar continua sendo
  // cartão/boleto (Checkout Pro, com redirecionamento), onConfirmarPix é o Pix direto (QR Code na
  // hora, sem sair da página).
  avulsa = false,
  onConfirmarPix,
  confirmandoPix = false,
}) {
  const { tema } = useTheme()
  const escuro = tema === 'dark'

  const faixa = obterFaixa(estimativa.faixa)
  const duracao = formatarDuracao(estimativa.duracaoEstimadaMinutos)
  const valorEscolhido = categoria === CATEGORIA.EXECUTIVO ? estimativa.valorReferenciaExecutivo : estimativa.valorReferenciaNormal

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
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${faixa.badge} ${faixa.texto}`}
        >
          {faixa.nome}
        </span>
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

      <div className={`mt-4 px-5 text-sm ${cores.subtexto}`}>
        {estimativa.distanciaEstimadaKm.toFixed(1)} km
        {duracao ? ` · ${duracao}` : ''}
      </div>

      {modo === 'confirmando' && onCategoriaChange ? (
        <div className="mt-3 grid grid-cols-2 gap-3 px-5">
          <button
            type="button"
            onClick={() => onCategoriaChange(CATEGORIA.NORMAL)}
            className={`rounded-xl border-2 p-3 text-left transition ${
              categoria === CATEGORIA.NORMAL
                ? 'border-current'
                : `border-transparent ${escuro ? 'bg-gray-900' : 'bg-gray-50'}`
            }`}
            style={categoria === CATEGORIA.NORMAL ? { borderColor: faixa.hex } : undefined}
          >
            <div className="text-xl">🚗</div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${cores.subtexto}`}>Normal</div>
            <div className="mt-0.5 text-lg font-bold" style={{ color: faixa.hex }}>
              {gratisPlano ? 'Grátis' : formatarPreco(estimativa.valorReferenciaNormal)}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onCategoriaChange(CATEGORIA.EXECUTIVO)}
            className={`rounded-xl border-2 p-3 text-left transition ${
              categoria === CATEGORIA.EXECUTIVO
                ? 'border-current'
                : `border-transparent ${escuro ? 'bg-gray-900' : 'bg-gray-50'}`
            }`}
            style={categoria === CATEGORIA.EXECUTIVO ? { borderColor: faixa.hex } : undefined}
          >
            <div className="text-xl">🚙</div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${cores.subtexto}`}>Executivo</div>
            <div className="mt-0.5 text-lg font-bold" style={{ color: faixa.hex }}>
              {formatarPreco(estimativa.valorReferenciaExecutivo)}
            </div>
          </button>
        </div>
      ) : (
        <div className="mt-3 flex justify-end px-5">
          <div className="text-lg font-bold" style={{ color: faixa.hex }}>
            {gratisPlano ? 'Grátis' : formatarPreco(valorEscolhido)}
          </div>
        </div>
      )}

      {modo === 'confirmando' && categoria === CATEGORIA.EXECUTIVO && (
        <p className={`mt-2 px-5 text-xs ${cores.subtexto}`}>
          Veículo até 3 anos, sedan médio ou SUV — só disponível como corrida avulsa.
        </p>
      )}

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
        {modo === 'confirmando' && avulsa ? (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onConfirmarPix}
              disabled={confirmando || confirmandoPix || bloqueado}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: faixa.hex }}
            >
              {confirmandoPix ? 'Gerando Pix...' : 'Pagar com Pix'}
            </button>
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
                disabled={confirmando || confirmandoPix || bloqueado}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium disabled:opacity-60 ${cores.botaoVoltar}`}
              >
                {confirmando ? 'Confirmando...' : 'Cartão / Boleto'}
              </button>
            </div>
          </div>
        ) : modo === 'confirmando' ? (
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
