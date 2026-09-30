import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import { clearToken, setToken } from '@/services/api'
import type { Usuario } from '@/types/api'

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    authService.me()
      .then(({ usuario: atual }) => {
        if (ativo) setUsuario(atual)
      })
      .catch(() => {
        clearToken()
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  async function entrar(email: string, senha: string) {
    const resposta = await authService.login(email, senha)
    setToken(resposta.token)
    setUsuario(resposta.usuario)
  }

  async function sair() {
    try {
      await authService.logout()
    } finally {
      clearToken()
      setUsuario(null)
    }
  }

  const value = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
