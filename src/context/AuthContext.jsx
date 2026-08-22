import { createContext, useContext, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import api, { extrairMensagemErro } from '../api/client'

const AuthContext = createContext(null)

// O AuthResponse do backend (Token, ExpiraEm, Email, UsuarioId) não traz as roles do usuário —
// elas vêm dentro do próprio JWT, então decodificamos o token pra saber se é Cliente/Motorista/Admin.
// O AuthController grava sub/email como claims curtas, e a role com o tipo longo ClaimTypes.Role.
function decodificarUsuario(token) {
  const payload = jwtDecode(token)

  const roleClaim =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
    payload.role

  const roles = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : []

  return {
    id: payload.sub,
    email: payload.email,
    roles,
  }
}

function carregarUsuarioSalvo() {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    return decodificarUsuario(token)
  } catch {
    // Token salvo veio corrompido/expirado de forma que nem dá pra decodificar — descarta.
    localStorage.removeItem('token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(carregarUsuarioSalvo)
  const [carregando, setCarregando] = useState(false)

  async function login(email, senha) {
    setCarregando(true)

    try {
      const { data } = await api.post('/Auth/login', { email, senha })

      localStorage.setItem('token', data.token)
      setUsuario(decodificarUsuario(data.token))

      return { sucesso: true }
    } catch (error) {
      return { sucesso: false, mensagem: extrairMensagemErro(error) }
    } finally {
      setCarregando(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)

  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>')
  }

  return contexto
}
