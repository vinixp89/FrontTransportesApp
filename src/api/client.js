import axios from 'axios'

// Aponta pra API .NET local (ver .env). Troque VITE_API_URL se sua porta for diferente.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Anexa o token JWT salvo no login em toda requisição, automaticamente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Se o token expirar ou for inválido, a API responde 401 — nesse caso, desloga e manda pro login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Tenta extrair uma mensagem de erro legível das respostas da API (formato { mensagem: "..." },
// lista de erros do Identity, ou erro genérico de validação do ASP.NET).
export function extrairMensagemErro(error) {
  const data = error?.response?.data

  if (!data) return 'Não foi possível contatar a API. Confira se ela está rodando.'

  if (typeof data === 'string') return data
  if (data.mensagem) return data.mensagem
  if (Array.isArray(data)) return data.join(', ')

  if (data.errors) {
    return Object.values(data.errors).flat().join(', ')
  }

  return 'Ocorreu um erro inesperado.'
}

export default api
