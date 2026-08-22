import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PedirCorridaPage from './pages/PedirCorridaPage'
import PacotesPage from './pages/PacotesPage'
import SaldoCorridaPage from './pages/SaldoCorridaPage'
import CarteiraPage from './pages/CarteiraPage'
import ExtratoPage from './pages/ExtratoPage'
import PlanosPage from './pages/PlanosPage'
import PagamentoRetornoPage from './pages/PagamentoRetornoPage'

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
              path="/planos/retorno"
              element={
                <ProtectedRoute role="Cliente">
                  <PagamentoRetornoPage />
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
