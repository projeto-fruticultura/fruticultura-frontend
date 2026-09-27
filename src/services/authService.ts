import { apiRequest } from '@/services/api'
import type { LoginResponse, MensagemResponse, Usuario } from '@/types/api'

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

  cadastrar(nome: string, email: string, senha: string) {
    return apiRequest<Usuario>('/usuarios', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ nome, email, senha }),
    })
  },

  solicitarRedefinicao(email: string) {
    return apiRequest<MensagemResponse>('/auth/esqueci-senha', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ email }),
    })
  },

  redefinirSenha(token: string, senha: string) {
    return apiRequest<MensagemResponse>('/auth/redefinir-senha', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ token, senha }),
    })
  },
}
