import { apiRequest } from '@/services/api'
import type { PropriedadeDetalhe, PropriedadePayload, PropriedadeResumo } from '@/types/api'

export const propriedadeService = {
  listar() {
    return apiRequest<PropriedadeResumo[]>('/propriedades')
  },

  buscarPorId(id: number) {
    return apiRequest<PropriedadeDetalhe>(`/propriedades/${id}`)
  },

  criar(payload: PropriedadePayload) {
    return apiRequest<PropriedadeDetalhe>('/propriedades', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  atualizar(id: number, payload: PropriedadePayload) {
    return apiRequest<PropriedadeDetalhe>(`/propriedades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  remover(id: number) {
    return apiRequest<void>(`/propriedades/${id}`, { method: 'DELETE' })
  },
}
