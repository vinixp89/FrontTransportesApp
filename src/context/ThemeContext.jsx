import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const CHAVE_ARMAZENAMENTO = 'tema'

function carregarTemaSalvo() {
  const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO)
  return salvo === 'dark' ? 'dark' : 'light'
}

// Tema vale pro site inteiro. A classe "dark" no <html> é o que liga as variantes dark: do
// Tailwind em qualquer componente — só precisa existir uma vez aqui, não em cada página.
export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(carregarTemaSalvo)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
  }, [tema])

  function alternarTema() {
    setTema((atual) => {
      const novo = atual === 'light' ? 'dark' : 'light'
      localStorage.setItem(CHAVE_ARMAZENAMENTO, novo)
      return novo
    })
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const contexto = useContext(ThemeContext)

  if (!contexto) {
    throw new Error('useTheme precisa ser usado dentro de um <ThemeProvider>')
  }

  return contexto
}
