import { apiRequest } from '@/services/api'
import { decodificarPaginaLogistica } from '@/lib/decodificarLogistica'
import type { FiltrosLogistica, LogisticaPayload } from '@/types/logistica'

export const logisticaService = {
  async listar(filtros: FiltrosLogistica = {}) {
    const query = new URLSearchParams()
    for (const [campo, valor] of Object.entries(filtros)) {
      if (valor !== undefined) query.set(campo, String(valor))
    }
    return decodificarPaginaLogistica(await apiRequest<unknown>(`/logistica?${query}`))
  },
  criar(payload: LogisticaPayload) {
    return apiRequest('/logistica', { method: 'POST', body: JSON.stringify(payload) })
  },
  atualizar(id: number, payload: Omit<LogisticaPayload, 'propriedadeId'>) {
    return apiRequest(`/logistica/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  remover(id: number) {
    return apiRequest<void>(`/logistica/${id}`, { method: 'DELETE' })
  },
}
