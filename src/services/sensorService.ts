import { apiRequest } from '@/services/api'

export interface Sensor {
  id: number
  codigo: string
  tipo: string
  localizacao: string | null
  dataInstalacao: string
  status: 'ATIVO' | 'INATIVO'
  loteId: number
  lote: {
    id: number
    identificacao: string
  }
}

export interface SensorPayload {
  codigo: string
  tipo: string
  localizacao: string
  dataInstalacao: string
  loteId: number
}

export const sensorService = {
  listar() {
    return apiRequest<Sensor[]>('/sensores')
  },

  buscarPorId(id: number) {
    return apiRequest<Sensor>(`/sensores/${id}`)
  },

  criar(payload: SensorPayload) {
    return apiRequest<Sensor>('/sensores', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  atualizar(id: number, payload: SensorPayload) {
    return apiRequest<Sensor>(`/sensores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  remover(id: number) {
    return apiRequest<void>(`/sensores/${id}`, {
      method: 'DELETE',
    })
  },
}