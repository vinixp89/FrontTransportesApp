import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco } from '../constants/faixas'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

// TipoTransacaoCarteira do backend vem serializado como número (0 = Recarga, 1 = Débito) —
// mesmo padrão de CorFaixa, sem JsonStringEnumConverter configurado na API.
const TIPO_LABEL = {
  0: { texto: 'Recarga', cor: 'text-green-600 dark:text-green-400', sinal: '+' },
  1: { texto: 'Débito', cor: 'text-red-500 dark:text-red-400', sinal: '-' },
}

export default function ExtratoPage() {
  const [transacoes, setTransacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/Carteiras/extrato')
      .then(({ data }) => setTransacoes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <div className="min-h-screen pb-16">
      <AppNavbar titulo="Extrato">
        <ThemeToggleButton />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-2xl px-4">
        {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>}
        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && transacoes.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma movimentação na carteira ainda.</p>
            <Link to="/carteira" className="mt-3 inline-block text-sm text-green-600 hover:underline dark:text-green-400">
              Fazer uma recarga →
            </Link>
          </div>
        )}

        {transacoes.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-gray-800">
            {transacoes.map((t, indice) => {
              const info = TIPO_LABEL[t.tipo] ?? TIPO_LABEL[0]
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    indice > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.descricao}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(t.data).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${info.cor}`}>
                    {info.sinal} {formatarPreco(t.valor)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
