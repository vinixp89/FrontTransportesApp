import { useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'

// StatusMotorista é serializado como número pelo backend (TransportesApp.Domain/Enums/Enums.cs):
// Offline = 0, Disponivel = 1, EmCorrida = 2.
const STATUS_DISPONIVEL = 1

// Botão quadrado de alternar disponível/offline, chamando os endpoints PATCH
// /Motoristas/ficar-disponivel e /Motoristas/ficar-offline (identificam o motorista pelo token,
// sem precisar do Id dele). Fica lado a lado com o quadrado de extrato na tela do motorista.
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
    <div>
      <button
        type="button"
        onClick={handleAlternar}
        disabled={carregando}
        className={`flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center shadow-lg transition disabled:opacity-60 ${
          online ? 'bg-gray-500 hover:bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-400' : 'bg-white/50'}`} />
        <span className="text-sm font-semibold text-white">
          {carregando ? 'Atualizando...' : online ? 'Ficar offline' : 'Ficar online'}
        </span>
      </button>

      {erro && (
        <p className="mt-3 max-w-[16rem] rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {erro}
        </p>
      )}
    </div>
  )
}
