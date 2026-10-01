import { useEffect, useMemo, useState } from 'react'
import api, { extrairMensagemErro } from '../api/client'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

const STATUS_LABEL = {
  0: { texto: 'Offline', cor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  1: { texto: 'Disponível', cor: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  2: { texto: 'Em corrida', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
}

// StatusConta: 0 Ativa, 1 Suspensa, 2 Banida (ver StatusContaMotorista no backend).
const CONTA_STATUS_LABEL = {
  1: { texto: 'Suspenso', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  2: { texto: 'Excluído', cor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
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
// O Admin também pode enviar/trocar a foto direto por aqui (útil quando o motorista não conseguiu
// mandar pelo app) — "versao" força recarregar a prévia depois de um upload.
function FotoMotorista({ motoristaId, tipo, label, disponivel, onAtualizar }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)
  const [versao, setVersao] = useState(0)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!disponivel) {
      setUrl(null)
      return
    }

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
  }, [motoristaId, tipo, disponivel, versao])

  async function enviarArquivo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setEnviando(true)
    setErro(false)

    const formData = new FormData()
    formData.append('arquivo', arquivo)

    try {
      const { data } = await api.post(`/Motoristas/${motoristaId}/foto-${tipo}`, formData)
      onAtualizar(data)
      setVersao((v) => v + 1)
    } catch {
      setErro(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-32 w-44 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        {!disponivel && !erro && <span className="text-xs text-gray-400 dark:text-gray-500">Sem foto</span>}
        {disponivel && !url && !erro && <span className="text-xs text-gray-400 dark:text-gray-500">Carregando...</span>}
        {erro && <span className="text-xs text-red-400">Falha ao carregar</span>}
        {disponivel && url && !erro && (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={label} className="h-32 w-44 object-cover" />
          </a>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <label className="cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
        {enviando ? 'Enviando...' : disponivel ? 'Trocar foto' : 'Enviar foto'}
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={enviarArquivo}
          disabled={enviando}
        />
      </label>
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

function formVazioDeMotorista(motorista) {
  const endereco = motorista.endereco
  return {
    nome: motorista.nome,
    cnh: motorista.cnh,
    cpf: motorista.cpf,
    telefone: motorista.telefone,
    placaVeiculo: motorista.placaVeiculo,
    modeloVeiculo: motorista.modeloVeiculo,
    anoVeiculo: motorista.anoVeiculo ?? '',
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento ?? '',
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    estado: endereco.estado,
  }
}

function MotoristaCard({ motorista, onAtualizar }) {
  const [aberto, setAberto] = useState(false)
  const [acao, setAcao] = useState(null) // null | 'suspender' | 'excluir'
  const [motivo, setMotivo] = useState('')
  const [dias, setDias] = useState('3')
  const [processando, setProcessando] = useState(false)
  const [erroAcao, setErroAcao] = useState('')

  const [editando, setEditando] = useState(false)
  const [formEdicao, setFormEdicao] = useState(() => formVazioDeMotorista(motorista))
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')

  const status = STATUS_LABEL[motorista.status] ?? STATUS_LABEL[0]
  const contaStatus = CONTA_STATUS_LABEL[motorista.statusConta]
  const endereco = motorista.endereco

  function cancelarAcao() {
    setAcao(null)
    setMotivo('')
    setErroAcao('')
  }

  function iniciarEdicao() {
    setFormEdicao(formVazioDeMotorista(motorista))
    setErroEdicao('')
    setEditando(true)
  }

  async function salvarEdicao(e) {
    e.preventDefault()
    setSalvandoEdicao(true)
    setErroEdicao('')

    try {
      const { data } = await api.put(`/Motoristas/${motorista.id}`, {
        ...formEdicao,
        anoVeiculo: formEdicao.anoVeiculo === '' ? null : Number(formEdicao.anoVeiculo),
      })
      onAtualizar(data)
      setEditando(false)
    } catch (error) {
      setErroEdicao(extrairMensagemErro(error))
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function confirmarSuspender() {
    if (!motivo.trim()) {
      setErroAcao('Informe o motivo da suspensão.')
      return
    }

    setProcessando(true)
    setErroAcao('')

    try {
      const { data } = await api.post(`/Motoristas/${motorista.id}/suspender`, {
        motivo: motivo.trim(),
        dias: dias === 'definitivo' ? null : Number(dias),
      })
      onAtualizar(data)
      cancelarAcao()
    } catch (error) {
      setErroAcao(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarExcluir() {
    if (!motivo.trim()) {
      setErroAcao('Informe o motivo da exclusão.')
      return
    }

    if (!window.confirm('Excluir o cadastro desse motorista por violação dos termos? Ele não vai mais conseguir logar (dá pra reverter depois em "Reativar").'))
      return

    setProcessando(true)
    setErroAcao('')

    try {
      const { data } = await api.post(`/Motoristas/${motorista.id}/banir`, { motivo: motivo.trim() })
      onAtualizar(data)
      cancelarAcao()
    } catch (error) {
      setErroAcao(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

  async function reativar() {
    if (!window.confirm('Reativar essa conta? O motorista volta a conseguir logar normalmente.')) return

    setProcessando(true)
    setErroAcao('')

    try {
      const { data } = await api.post(`/Motoristas/${motorista.id}/reativar`)
      onAtualizar(data)
    } catch (error) {
      setErroAcao(extrairMensagemErro(error))
    } finally {
      setProcessando(false)
    }
  }

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
          {contaStatus && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${contaStatus.cor}`}>{contaStatus.texto}</span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cor}`}>{status.texto}</span>
          <span className="text-gray-400">{aberto ? '▲' : '▼'}</span>
        </div>
      </button>

      {aberto && (
        <div className="border-t border-gray-100 p-5 dark:border-gray-700">
          {!editando && (
            <>
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

              <button
                type="button"
                onClick={iniciarEdicao}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Editar dados
              </button>
            </>
          )}

          {editando && (
            <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nome</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.nome}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, nome: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">CNH</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.cnh}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, cnh: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">CPF</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.cpf}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, cpf: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Telefone</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.telefone}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, telefone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Placa</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.placaVeiculo}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, placaVeiculo: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Modelo do veículo</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.modeloVeiculo}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, modeloVeiculo: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Ano de fabricação</label>
                  <input
                    type="number"
                    value={formEdicao.anoVeiculo}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, anoVeiculo: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Logradouro</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.logradouro}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, logradouro: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Número</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.numero}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, numero: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Complemento</label>
                  <input
                    type="text"
                    value={formEdicao.complemento}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, complemento: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Bairro</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.bairro}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, bairro: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Cidade</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.cidade}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, cidade: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Estado</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formEdicao.estado}
                    onChange={(e) => setFormEdicao((f) => ({ ...f, estado: e.target.value.toUpperCase() }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {erroEdicao && <p className="text-xs text-red-600 dark:text-red-400">{erroEdicao}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  disabled={salvandoEdicao}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!editando && (
          <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Selo ok={motorista.telefoneVerificado} textoOk="Telefone verificado" textoFalta="Telefone não verificado" />
            <Selo ok={motorista.termosAceitos} textoOk="Termos aceitos" textoFalta="Termos pendentes" />
            <Selo ok={motorista.fotosEnviadas} textoOk="Fotos enviadas" textoFalta="Sem fotos enviadas" />
          </div>

          {motorista.statusConta !== 0 && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <p className="font-semibold">
                {motorista.statusConta === 2
                  ? 'Conta excluída por violação dos termos'
                  : `Conta suspensa ${motorista.bloqueadoAte ? `até ${formatarData(motorista.bloqueadoAte)}` : 'definitivamente'}`}
              </p>
              <p className="mt-0.5">Motivo: {motorista.motivoBloqueio}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-start">
            <FotoMotorista motoristaId={motorista.id} tipo="selfie" label="Selfie" disponivel={motorista.temFotoSelfie} onAtualizar={onAtualizar} />
            <FotoMotorista motoristaId={motorista.id} tipo="veiculo" label="Veículo" disponivel={motorista.temFotoVeiculo} onAtualizar={onAtualizar} />
            <FotoMotorista motoristaId={motorista.id} tipo="placa" label="Placa" disponivel={motorista.temFotoPlaca} onAtualizar={onAtualizar} />
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
            {acao === null && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAcao('suspender')}
                  className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
                >
                  Suspender
                </button>
                <button
                  type="button"
                  onClick={() => setAcao('excluir')}
                  className="rounded-lg border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Excluir cadastro
                </button>
                {motorista.statusConta !== 0 && (
                  <button
                    type="button"
                    onClick={reativar}
                    disabled={processando}
                    className="rounded-lg border border-green-400 px-3 py-1.5 text-xs font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-60 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    Reativar conta
                  </button>
                )}
              </div>
            )}

            {acao === 'suspender' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Motivo da suspensão</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ex.: Reclamações repetidas de comportamento"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Por quanto tempo</label>
                <select
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="3">3 dias</option>
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                  <option value="definitivo">Definitivamente</option>
                </select>

                {erroAcao && <p className="text-xs text-red-600 dark:text-red-400">{erroAcao}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmarSuspender}
                    disabled={processando}
                    className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                  >
                    {processando ? 'Suspendendo...' : 'Confirmar suspensão'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarAcao}
                    disabled={processando}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {acao === 'excluir' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Motivo da exclusão</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ex.: Fraude comprovada em corrida"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />

                {erroAcao && <p className="text-xs text-red-600 dark:text-red-400">{erroAcao}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmarExcluir}
                    disabled={processando}
                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {processando ? 'Excluindo...' : 'Confirmar exclusão'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarAcao}
                    disabled={processando}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
          </>
          )}
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

  function handleAtualizarMotorista(atualizado) {
    setMotoristas((atual) => atual.map((m) => (m.id === atualizado.id ? atualizado : m)))
  }

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
            <MotoristaCard key={motorista.id} motorista={motorista} onAtualizar={handleAtualizarMotorista} />
          ))}
        </div>
      </main>
    </div>
  )
}
