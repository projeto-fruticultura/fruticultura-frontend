import { apiRequest } from '@/services/api'
import type { Cultura, CulturaPayload } from '@/types/api'

export const culturaService = {
  listar() {
    return apiRequest<Cultura[]>('/culturas')
  },

  buscarPorId(id: number) {
    return apiRequest<Cultura>(`/culturas/${id}`)
  },

  criar(payload: CulturaPayload) {
    return apiRequest<Cultura>('/culturas', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  atualizar(id: number, payload: CulturaPayload) {
    return apiRequest<Cultura>(`/culturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  remover(id: number) {
    return apiRequest<void>(`/culturas/${id}`, {
      method: 'DELETE',
    })
  },
}