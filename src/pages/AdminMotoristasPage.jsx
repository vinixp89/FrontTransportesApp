import { useEffect, useMemo, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const STATUS_LABEL = {
  0: { texto: 'Offline', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  1: { texto: 'Disponível', cor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  2: { texto: 'Em corrida', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
}

function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Fotos de verificação exigem o token JWT no header (não dá pra usar <img src="..."> direto) —
// mesmo padrão do AdminExecutivoPage: busca como blob autenticado e vira uma object URL. Só
// carrega quando o card é expandido, pra não baixar foto de todo motorista da lista de uma vez.
function FotoMotorista({ motoristaId, tipo, label, disponivel }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!disponivel) return

    let objectUrl
    let cancelado = false

    api
      .get(`/Motoristas/${motoristaId}/foto-${tipo}`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelado) return
        objectUrl = URL.createObjectURL(data)
        setUrl(objectUrl)
      })
      .catch(() => !cancelado && setErro(true))

    return () => {
      cancelado = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [motoristaId, tipo, disponivel])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        {!disponivel && <span className="text-xs text-gray-400 dark:text-gray-500">Sem foto</span>}
        {disponivel && !url && !erro && <span className="text-xs text-gray-400 dark:text-gray-500">Carregando...</span>}
        {disponivel && erro && <span className="text-xs text-red-400">Falha ao carregar</span>}
        {disponivel && url && (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} className="h-32 w-44 object-cover" />
          </a>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

function Selo({ ok, textoOk, textoFalta }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
          : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
      }`}
    >
      {ok ? textoOk : textoFalta}
    </span>
  )
}

function MotoristaCard({ motorista }) {
  const [aberto, setAberto] = useState(false)
  const status = STATUS_LABEL[motorista.status] ?? STATUS_LABEL[0]
  const endereco = motorista.endereco

  return (
    <div className="rounded-2xl bg-white shadow dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
      >
        <div>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{motorista.nome}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CPF {formatarCpf(motorista.cpf)} · {motorista.placaVeiculo} · {motorista.modeloVeiculo}
            {motorista.anoVeiculo ? ` (${motorista.anoVeiculo})` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">★ {motorista.avaliacaoMeida.toFixed(1)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cor}`}>{status.texto}</span>
          <span className="text-gray-400">{aberto ? '▲' : '▼'}</span>
        </div>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 p-5 dark:border-gray-700">
          <div className="grid gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
            <p><span className="text-gray-400 dark:text-gray-500">CNH:</span> {motorista.cnh}</p>
            <p><span className="text-gray-400 dark:text-gray-500">Telefone:</span> {motorista.telefone}</p>
            <p><span className="text-gray-400 dark:text-gray-500">Veículo:</span> {motorista.modeloVeiculo} · {motorista.placaVeiculo}</p>
            <p><span className="text-gray-400 dark:text-gray-500">Ano de fabricação:</span> {motorista.anoVeiculo ?? '—'}</p>
            <p className="sm:col-span-2">
              <span className="text-gray-400 dark:text-gray-500">Endereço:</span>{' '}
              {endereco.logradouro}, {endereco.numero}
              {endereco.complemento ? ` (${endereco.complemento})` : ''} — {endereco.bairro}, {endereco.cidade}/{endereco.estado}
            </p>
            <p><span className="text-gray-400 dark:text-gray-500">Cadastrado em:</span> {formatarData(motorista.dataCadastro)}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Selo ok={motorista.telefoneVerificado} textoOk="Telefone verificado" textoFalta="Telefone não verificado" />
            <Selo ok={motorista.termosAceitos} textoOk="Termos aceitos" textoFalta="Termos pendentes" />
            <Selo ok={motorista.fotosEnviadas} textoOk="Fotos enviadas" textoFalta="Sem fotos enviadas" />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-start">
            <FotoMotorista motoristaId={motorista.id} tipo="selfie" label="Selfie" disponivel={motorista.fotosEnviadas} />
            <FotoMotorista motoristaId={motorista.id} tipo="veiculo" label="Veículo" disponivel={motorista.fotosEnviadas} />
            <FotoMotorista motoristaId={motorista.id} tipo="placa" label="Placa" disponivel={motorista.fotosEnviadas} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMotoristasPage() {
  const [motoristas, setMotoristas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    api
      .get('/Motoristas')
      .then(({ data }) => setMotoristas(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return motoristas

    return motoristas.filter((m) =>
      [m.nome, m.cpf, m.placaVeiculo, m.telefone].some((campo) => campo?.toLowerCase().includes(termo))
    )
  }, [motoristas, busca])

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      <AppNavbar titulo="Painel Admin — motoristas cadastrados">
        <ThemeToggleButton variant="neutro" />
      </AppNavbar>

      <main className="mx-auto mt-8 max-w-3xl px-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtrados.length} de {motoristas.length} motorista{motoristas.length === 1 ? '' : 's'}
          </p>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF, placa ou telefone"
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

        {!carregando && filtrados.length === 0 && !erro && (
          <div className="rounded-2xl bg-white p-6 text-center shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum motorista encontrado.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtrados.map((motorista) => (
            <MotoristaCard key={motorista.id} motorista={motorista} />
          ))}
        </div>
      </main>
    </div>
  )
}
