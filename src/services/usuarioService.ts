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

  atualizar(id: number, dados: Pick<Usuario, 'nome' | 'email'>) {
    return apiRequest<Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  },

  inativar(id: number) {
    return apiRequest<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    })
  },

  reativar(id: number) {
    return apiRequest<void>(`/usuarios/${id}/reativar`, {
      method: 'PATCH',
    })
  },
}