import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import EnderecoFields, { enderecoVazio } from '../components/EnderecoFields'
import RideConfirmCard from '../components/RideConfirmCard'
import { obterFaixa } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const TIPO_CONSUMO = { AVULSA: 0, PACOTE: 1, BENEFICIO: 2 }
const CATEGORIA = { NORMAL: 0, EXECUTIVO: 1 }

export default function PedirCorridaPage() {
  const navigate = useNavigate()

  // 'form' -> preenchendo endereços | 'confirmando' -> revisando estimativa
  // (ao confirmar, navega pra /corrida/:id em vez de ficar numa 3ª etapa aqui)
  const [etapa, setEtapa] = useState('form')

  const [origem, setOrigem] = useState(enderecoVazio)
  const [destino, setDestino] = useState(enderecoVazio)
  const [categoria, setCategoria] = useState(CATEGORIA.NORMAL)
  const [tipoConsumo, setTipoConsumo] = useState(TIPO_CONSUMO.AVULSA)
  const [pacotes, setPacotes] = useState([])
  const [pacoteCorridasId, setPacoteCorridasId] = useState('')
  const [beneficio, setBeneficio] = useState(null)

  const [estimando, setEstimando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')
  const [estimativa, setEstimativa] = useState(null)

  // Categoria Executivo só existe como corrida avulsa por enquanto (ver CorridaService.CriarAsync no
  // backend) — trava a forma de pagamento em avulsa automaticamente pra não deixar o cliente
  // escolher uma combinação que o backend vai recusar.
  useEffect(() => {
    if (categoria === CATEGORIA.EXECUTIVO && tipoConsumo !== TIPO_CONSUMO.AVULSA) {
      setTipoConsumo(TIPO_CONSUMO.AVULSA)
    }
  }, [categoria, tipoConsumo])

  // Só busca os pacotes do cliente quando ele escolhe pagar com pacote — evita uma chamada à toa.
  useEffect(() => {
    if (tipoConsumo !== TIPO_CONSUMO.PACOTE) return

    api
      .get('/PacotesCorridas/meus-pacotes')
      .then(({ data }) => setPacotes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
  }, [tipoConsumo])

  // Status do benefício de corrida grátis do plano (se o cliente tiver um) — busca uma vez ao abrir
  // a tela, pra saber se mostra a opção "usar corrida grátis do plano" no formulário.
  useEffect(() => {
    api
      .get('/Planos/beneficio')
      .then(({ data }) => setBeneficio(data))
      .catch(() => setBeneficio(null))
  }, [])

  const pacotesDisponiveis = pacotes.filter((p) => p.quantidadeRestante > 0)
  const pacoteSelecionado = pacotesDisponiveis.find((p) => p.id === pacoteCorridasId)
  const corBeneficio = beneficio?.temBeneficio ? obterFaixa(beneficio.corBeneficio) : null

  // Se o pacote escolhido é de uma faixa diferente da que a corrida caiu, o backend vai recusar —
  // avisa isso já na tela de confirmação, antes do cliente tentar confirmar.
  const erroFaixaPacote =
    estimativa && tipoConsumo === TIPO_CONSUMO.PACOTE && pacoteSelecionado && pacoteSelecionado.faixa !== estimativa.faixa
      ? `Esse pacote é da faixa ${obterFaixa(pacoteSelecionado.faixa).nome}, mas essa corrida caiu na faixa ${obterFaixa(estimativa.faixa).nome}. Volte e escolha outro pacote ou pague avulso.`
      : ''

  // Mesma ideia, só que pro benefício do plano: a corrida grátis só vale pra corridas que caiam
  // exatamente na cor que o plano libera (ex: Premium só cobre corrida Azul).
  const erroFaixaBeneficio =
    estimativa && tipoConsumo === TIPO_CONSUMO.BENEFICIO && corBeneficio && corBeneficio.valor !== estimativa.faixa
      ? `Sua corrida grátis vale só pra faixa ${corBeneficio.nome}, mas essa corrida caiu na faixa ${obterFaixa(estimativa.faixa).nome}. Volte e escolha outra forma de pagamento.`
      : ''

  const origemResolvida = Boolean(origem.logradouro)
  const destinoResolvido = Boolean(destino.logradouro)

  async function handleEstimar(event) {
    event.preventDefault()
    setErro('')

    // O campo de endereço só preenche esses dados estruturados quando o usuário escolhe uma
    // sugestão da lista — se ele digitou e não escolheu, não tem como estimar a corrida ainda.
    if (!origemResolvida || !destinoResolvido) {
      setErro('Escolha os endereços de origem e destino na lista de sugestões.')
      return
    }

    if (tipoConsumo === TIPO_CONSUMO.PACOTE && !pacoteCorridasId) {
      setErro('Escolha um pacote de corridas.')
      return
    }

    setEstimando(true)

    try {
      const { data } = await api.post('/Corridas/estimar', { origem, destino, categoria })
      setEstimativa(data)
      setEtapa('confirmando')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setEstimando(false)
    }
  }

  async function handleConfirmar() {
    setErro('')
    setConfirmando(true)

    try {
      // Corrida avulsa não debita mais de um saldo pré-carregado — abre o checkout do Mercado Pago
      // pelo valor exato dela, e a corrida só é liberada de verdade quando o pagamento confirmar
      // (ver PagamentoService no backend). O retorno do checkout volta pra /pagamentos/retorno.
      if (tipoConsumo === TIPO_CONSUMO.AVULSA) {
        const { data } = await api.post('/Corridas/avulsa', { origem, destino, tipoConsumo, pacoteCorridasId: null, categoria })
        window.location.href = data.checkoutUrl
        return
      }

      const { data } = await api.post('/Corridas', {
        origem,
        destino,
        tipoConsumo,
        pacoteCorridasId: tipoConsumo === TIPO_CONSUMO.PACOTE ? pacoteCorridasId : null,
        categoria,
      })

      // Daqui pra frente quem cuida do status da corrida (motorista aceitar, se deslocar até o
      // cliente, etc) é a tela de acompanhamento — ela já faz o polling sozinha.
      navigate(`/corrida/${data.id}`)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setConfirmando(false)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Pedir corrida">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        {etapa === 'form' && (
          <form onSubmit={handleEstimar} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow dark:bg-gray-800">
            <EnderecoFields titulo="Origem" valores={origem} onChange={setOrigem} />
            <EnderecoFields titulo="Destino" valores={destino} onChange={setDestino} />

            <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-gray-600">
              <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</legend>

              <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={categoria === CATEGORIA.NORMAL}
                    onChange={() => setCategoria(CATEGORIA.NORMAL)}
                  />
                  Normal
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={categoria === CATEGORIA.EXECUTIVO}
                    onChange={() => setCategoria(CATEGORIA.EXECUTIVO)}
                  />
                  Executivo
                </label>
              </div>

              {categoria === CATEGORIA.EXECUTIVO && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Veículo até 3 anos, sedan médio ou SUV. Preço mais alto, só disponível como corrida
                  avulsa (sem pacote ou benefício de plano).
                </p>
              )}
            </fieldset>

            <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-gray-600">
              <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Forma de pagamento</legend>

              <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={tipoConsumo === TIPO_CONSUMO.AVULSA}
                    onChange={() => setTipoConsumo(TIPO_CONSUMO.AVULSA)}
                  />
                  Corrida avulsa (pagar agora via Mercado Pago)
                </label>
                <label className={`flex items-center gap-2 ${categoria === CATEGORIA.EXECUTIVO ? 'opacity-60' : ''}`}>
                  <input
                    type="radio"
                    checked={tipoConsumo === TIPO_CONSUMO.PACOTE}
                    disabled={categoria === CATEGORIA.EXECUTIVO}
                    onChange={() => setTipoConsumo(TIPO_CONSUMO.PACOTE)}
                  />
                  Usar pacote de corridas
                </label>

                {corBeneficio && (
                  <label className={`flex items-center gap-2 ${!beneficio.disponivelParaUso || categoria === CATEGORIA.EXECUTIVO ? 'opacity-60' : ''}`}>
                    <input
                      type="radio"
                      checked={tipoConsumo === TIPO_CONSUMO.BENEFICIO}
                      disabled={!beneficio.disponivelParaUso || categoria === CATEGORIA.EXECUTIVO}
                      onChange={() => setTipoConsumo(TIPO_CONSUMO.BENEFICIO)}
                    />
                    Corrida {corBeneficio.nome.toLowerCase()} grátis do plano
                  </label>
                )}
              </div>

              {corBeneficio && !beneficio.disponivelParaUso && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {beneficio.jaUsadoNoMes
                    ? `Você já usou sua corrida ${corBeneficio.nome.toLowerCase()} grátis deste mês.`
                    : `Faça uma corrida paga este mês pra liberar sua corrida ${corBeneficio.nome.toLowerCase()} grátis.`}
                </p>
              )}

              {tipoConsumo === TIPO_CONSUMO.BENEFICIO && corBeneficio && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Só vale pra corridas da faixa {corBeneficio.nome} ({corBeneficio.km}).
                </p>
              )}

              {tipoConsumo === TIPO_CONSUMO.PACOTE && (
                <div className="mt-3">
                  {pacotesDisponiveis.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Você não tem pacotes com corridas disponíveis. Compre um pelo Swagger
                      (<code>POST /api/PacotesCorridas</code>) ou escolha corrida avulsa.
                    </p>
                  ) : (
                    <select
                      value={pacoteCorridasId}
                      onChange={(e) => setPacoteCorridasId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione um pacote</option>
                      {pacotesDisponiveis.map((p) => {
                        const faixa = obterFaixa(p.faixa)
                        return (
                          <option key={p.id} value={p.id}>
                            {faixa.nome} — {p.quantidadeRestante} corrida(s) restante(s)
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
              )}
            </fieldset>

            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}

            <button
              type="submit"
              disabled={estimando || !origemResolvida || !destinoResolvido}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {estimando ? 'Calculando rota...' : 'Ver valor da corrida'}
            </button>
          </form>
        )}

        {etapa === 'confirmando' && estimativa && (
          <RideConfirmCard
            estimativa={estimativa}
            modo={etapa}
            onConfirmar={handleConfirmar}
            onCancelar={() => setEtapa('form')}
            confirmando={confirmando}
            erro={erro || erroFaixaPacote || erroFaixaBeneficio}
            bloqueado={Boolean(erroFaixaPacote || erroFaixaBeneficio)}
            gratisPlano={tipoConsumo === TIPO_CONSUMO.BENEFICIO}
          />
        )}
      </main>
    </div>
  )
}
