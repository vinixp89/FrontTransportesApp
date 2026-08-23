import { useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'

// StatusMotorista é serializado como número pelo backend (TransportesApp.Domain/Enums/Enums.cs):
// Offline = 0, Disponivel = 1, EmCorrida = 2.
const STATUS_DISPONIVEL = 1

// Cartão principal da tela do motorista: alterna entre disponível/offline chamando os endpoints
// PATCH /Motoristas/ficar-disponivel e /Motoristas/ficar-offline (identificam o motorista pelo
// token, sem precisar do Id dele). Mesma linguagem visual dos cartões de ação do cliente
// (rounded-2xl, shadow-lg, cor sólida), só que em roxo — a cor de marca do perfil Motorista.
export default function MotoristaOnlineCard() {
  const [online, setOnline] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAlternar() {
    setCarregando(true)
    setErro('')

    try {
      const endpoint = online ? '/Motoristas/ficar-offline' : '/Motoristas/ficar-disponivel'
      const { data } = await api.patch(endpoint)
      setOnline(data.status === STATUS_DISPONIVEL)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {online ? 'Você está online' : 'Você está offline'}
        </span>
      </div>

      <button
        type="button"
        onClick={handleAlternar}
        disabled={carregando}
        className={`w-full rounded-2xl p-6 text-lg font-semibold text-white shadow-lg transition disabled:opacity-60 ${
          online ? 'bg-gray-500 hover:bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {carregando ? 'Atualizando...' : online ? 'Ficar offline' : 'Ficar online'}
      </button>

      <p className="mt-3 text-sm text-purple-900/70 dark:text-purple-200/70">
        {online
          ? 'Você vai começar a receber pedidos de corrida na sua região.'
          : 'Fique online pra começar a receber pedidos de corrida.'}
      </p>

      {erro && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erro}
        </p>
      )}
    </div>
  )
}
