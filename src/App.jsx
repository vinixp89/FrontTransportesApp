import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PedirCorridaPage from './pages/PedirCorridaPage'
import AcompanharCorridaPage from './pages/AcompanharCorridaPage'
import PacotesPage from './pages/PacotesPage'
import SaldoCorridaPage from './pages/SaldoCorridaPage'
import CarteiraPage from './pages/CarteiraPage'
import ExtratoPage from './pages/ExtratoPage'
import PlanosPage from './pages/PlanosPage'
import PagamentoRetornoPage from './pages/PagamentoRetornoPage'
import ExtratoCorridasPage from './pages/ExtratoCorridasPage'
import CorridasMotoristaPage from './pages/CorridasMotoristaPage'
import AdminCorridasPage from './pages/AdminCorridasPage'
import MotoristaExecutivoPage from './pages/MotoristaExecutivoPage'
import DoarCorridaPage from './pages/DoarCorridaPage'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedir-corrida"
              element={
                <ProtectedRoute role="Cliente">
                  <PedirCorridaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corrida/:id"
              element={
                <ProtectedRoute role="Cliente">
                  <AcompanharCorridaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacotes"
              element={
                <ProtectedRoute role="Cliente">
                  <PacotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saldo-corridas"
              element={
                <ProtectedRoute role="Cliente">
                  <SaldoCorridaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carteira"
              element={
                <ProtectedRoute role="Cliente">
                  <CarteiraPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/extrato"
              element={
                <ProtectedRoute role="Cliente">
                  <ExtratoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planos"
              element={
                <ProtectedRoute role="Cliente">
                  <PlanosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pagamentos/retorno"
              element={
                <ProtectedRoute role="Cliente">
                  <PagamentoRetornoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/motorista/extrato"
              element={
                <ProtectedRoute role="Motorista">
                  <ExtratoCorridasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/motorista/corridas"
              element={
                <ProtectedRoute role="Motorista">
                  <CorridasMotoristaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/corridas"
              element={
                <ProtectedRoute role="Admin">
                  <AdminCorridasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/motorista/executivo"
              element={
                <ProtectedRoute role="Motorista">
                  <MotoristaExecutivoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doar-corrida"
              element={
                <ProtectedRoute role="Cliente">
                  <DoarCorridaPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
