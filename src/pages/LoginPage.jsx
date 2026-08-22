import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'
import ThemeToggleButton from '../components/ThemeToggleButton'
import AppNavbar from '../components/AppNavbar'

export default function LoginPage() {
  const { usuario, carregando, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  // Já logado? Não faz sentido mostrar a tela de login de novo.
  if (usuario) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    const resultado = await login(email, senha)

    if (resultado.sucesso) {
      navigate('/')
    } else {
      setErro(resultado.mensagem)
    }
  }

  return (
    <div className="min-h-screen d-flex flex-column">
      <AppNavbar brand>
        <ThemeToggleButton />
      </AppNavbar>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-4 py-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <BrandLogo tamanho={40} className="mb-3" />
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Entre com sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Ainda não tem conta? Cadastre-se pelo Swagger da API por enquanto
          (<code>/api/Auth/registrar-cliente</code> ou <code>/registrar-motorista</code>).
        </p>
      </div>
      </div>
    </div>
  )
}
