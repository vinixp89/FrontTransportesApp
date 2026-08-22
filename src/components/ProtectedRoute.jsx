import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protege uma rota: sem login, manda pro /login. Se `role` for passado, também exige
// que o usuário logado tenha aquela role (ex: só Cliente pode pedir corrida).
export default function ProtectedRoute({ children, role }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (role && !usuario.roles.includes(role)) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Essa área é exclusiva para usuários com o perfil <strong>{role}</strong>.
        </p>
      </div>
    )
  }

  return children
}
