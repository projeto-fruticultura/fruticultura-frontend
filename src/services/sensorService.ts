import { apiRequest } from '@/services/api'
import type { Sensor, SensorPayload } from '@/types/api'

export const sensorService = {
  listar() {
    return apiRequest<Sensor[]>('/sensores')
  },

  buscarPorId(id: number) {
    return apiRequest<Sensor>(`/sensores/${id}`)
  },

  // Codigo repetido: 409.
  criar(payload: SensorPayload) {
    return apiRequest<Sensor>('/sensores', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // O PUT de sensor troca todos os campos do cadastro (nao e parcial).
  atualizar(id: number, payload: SensorPayload) {
    return apiRequest<Sensor>(`/sensores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  remover(id: number) {
    return apiRequest<void>(`/sensores/${id}`, { method: 'DELETE' })
  },
}
