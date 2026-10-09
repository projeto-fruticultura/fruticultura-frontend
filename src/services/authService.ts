import { apiRequest } from '@/services/api'
import type { LoginResponse, Usuario } from '@/types/api'

// Nao ha cadastro publico nem recuperacao de senha no backend: so um ADMIN logado cria usuarios (POST /usuarios).
export const authService = {
  login(email: string, senha: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ email, senha }),
    })
  },

  me() {
    return apiRequest<{ usuario: Usuario }>('/auth/me')
  },

  logout() {
    return apiRequest<void>('/auth/logout', { method: 'POST' })
  },
}
