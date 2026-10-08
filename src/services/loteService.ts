import { apiRequest } from '@/services/api'
import type { Lote, LoteCampos, LotePayload } from '@/types/api'

export const loteService = {
  listar(propriedadeId?: number) {
    const consulta = propriedadeId ? `?propriedadeId=${propriedadeId}` : ''
    return apiRequest<Lote[]>(`/lotes${consulta}`)
  },

  buscarPorId(id: number) {
    return apiRequest<Lote>(`/lotes/${id}`)
  },

  criar(payload: LotePayload) {
    return apiRequest<Lote>('/lotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // PUT parcial: so o que for enviado muda.
  atualizar(id: number, campos: Partial<LoteCampos>) {
    return apiRequest<Lote>(`/lotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campos),
    })
  },

  // Exclusao logica. Com sensores ativos o backend responde 409 com { erro, totalSensores };
  // repetir com confirmar = true inativa o lote e os sensores dele.
  remover(id: number, confirmar = false) {
    return apiRequest<void>(`/lotes/${id}${confirmar ? '?confirmar=true' : ''}`, { method: 'DELETE' })
  },
}
