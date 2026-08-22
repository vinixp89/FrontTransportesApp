import { useEffect, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco, obterFaixa } from '../constants/faixas'
import { obterEstiloPlano } from '../constants/planos'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function PlanosPage() {
  const [catalogo, setCatalogo] = useState([])
  const [assinaturaAtual, setAssinaturaAtual] = useState(null)
  const [beneficio, setBeneficio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState('') // tipo do plano em assinatura/cancelamento
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  function carregarTudo() {
    return Promise.all([
      api.get('/Planos/catalogo').then(({ data }) => setCatalogo(data)),
      api.get('/Planos/minha-assinatura').then(({ data }) => setAssinaturaAtual(data)),
      // Só informativo pra tela — se a assinatura atual não tiver esse benefício, a API devolve
      // temBeneficio: false e o card simplesmente não mostra nada extra.
      api.get('/Planos/beneficio').then(({ data }) => setBeneficio(data)),
    ]).catch((error) => setErro(extrairMensagemErro(error)))
  }

  useEffect(() => {
    carregarTudo().finally(() => setCarregando(false))
  }, [])

  async function handleAssinar(tipo, nome) {
    setProcessando(`assinar-${tipo}`)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Planos/assinar', { tipo })
      setAssinaturaAtual(data)
      setMensagemSucesso(`Assinatura do plano ${nome} confirmada!`)
      // Trocar de plano muda (ou zera) o benefício de corrida grátis — busca o status atualizado.
      const { data: novoBeneficio } = await api.get('/Planos/beneficio')
      setBeneficio(novoBeneficio)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setProcessando('')
    }
  }

  async function handleCancelar() {
    setProcessando('cancelar')
    setErro('')
    setMensagemSucesso('')

    try {
      await api.post('/Planos/cancelar')
      setAssinaturaAtual(null)
      setBeneficio(null)
      setMensagemSucesso('Assinatura cancelada.')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setProcessando('')
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Planos">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-5xl px-4">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Assine um plano e aproveite os benefícios enquanto ele estiver ativo. Você pode trocar de
          plano ou cancelar quando quiser — a mudança vale a partir de agora.
        </p>

        {mensagemSucesso && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {mensagemSucesso}
          </div>
        )}

        {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando planos...</p>}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalogo.map((plano) => {
            const estilo = obterEstiloPlano(plano.tipo)
            const ehPlanoAtual = assinaturaAtual?.tipo === plano.tipo
            const processandoEsse = processando === `assinar-${plano.tipo}`

            // Status do benefício de corrida grátis só faz sentido mostrar no card do plano que o
            // cliente já assinou de fato — pros outros planos, o benefício já aparece descrito na
            // lista abaixo (vem do texto em Beneficios).
            const corBeneficio = ehPlanoAtual && beneficio?.temBeneficio ? obterFaixa(beneficio.corBeneficio) : null

            return (
              <div
                key={plano.tipo}
                className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow dark:bg-gray-800 ${estilo.borda}`}
              >
                {estilo.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                    {estilo.selo ?? 'Mais popular'}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plano.nome}</h3>

                <p className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plano.precoMensal === 0 ? 'Grátis' : formatarPreco(plano.precoMensal)}
                  </span>
                  {plano.precoMensal > 0 && <span className="text-sm text-gray-400 dark:text-gray-500">/mês</span>}
                </p>

                <ul className="mb-6 flex flex-1 flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {plano.beneficios.map((textoBeneficio) => (
                    <li key={textoBeneficio} className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-600 dark:text-green-400">✓</span>
                      <span>{textoBeneficio}</span>
                    </li>
                  ))}
                </ul>

                {ehPlanoAtual ? (
                  <div className="flex flex-col gap-2">
                    <span className="rounded-lg border border-green-600 px-4 py-2 text-center text-sm font-medium text-green-700 dark:border-green-500 dark:text-green-400">
                      Seu plano atual
                    </span>

                    {corBeneficio && (
                      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        {beneficio.jaUsadoNoMes
                          ? `Corrida ${corBeneficio.nome.toLowerCase()} grátis já usada este mês.`
                          : beneficio.disponivelParaUso
                            ? `Corrida ${corBeneficio.nome.toLowerCase()} grátis liberada — peça em "Pedir corrida".`
                            : `Faça uma corrida paga este mês pra liberar sua corrida ${corBeneficio.nome.toLowerCase()} grátis.`}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleCancelar}
                      disabled={processando === 'cancelar'}
                      className="text-xs text-gray-400 hover:text-red-500 hover:underline disabled:opacity-50 dark:text-gray-500 dark:hover:text-red-400"
                    >
                      {processando === 'cancelar' ? 'Cancelando...' : 'Cancelar assinatura'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAssinar(plano.tipo, plano.nome)}
                    disabled={processandoEsse}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 ${estilo.botao}`}
                  >
                    {processandoEsse ? 'Assinando...' : 'Assinar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
