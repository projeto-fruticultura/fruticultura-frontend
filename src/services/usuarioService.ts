import { apiRequest } from '@/services/api'
import type { Usuario, UsuarioPayload } from '@/types/api'

export const usuarioService = {
  listar() {
    return apiRequest<Usuario[]>('/usuarios')
  },

  criar(payload: UsuarioPayload) {
    return apiRequest<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}