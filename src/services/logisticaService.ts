import { apiRequest } from '@/services/api'
import { decodificarLogistica } from '@/lib/decodificarLogistica'
import type { LogisticaPayload, LogisticaRegistro } from '@/types/logistica'

export const logisticaService = {
  async listar() {
    return decodificarLogistica(await apiRequest<unknown>('/logistica'))
  },
  criar(payload: LogisticaPayload) {
    return apiRequest<LogisticaRegistro>('/logistica', { method: 'POST', body: JSON.stringify(payload) })
  },
  atualizar(id: number, payload: LogisticaPayload) {
    return apiRequest<LogisticaRegistro>(`/logistica/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  remover(id: number) {
    return apiRequest<void>(`/logistica/${id}`, { method: 'DELETE' })
  },
}
