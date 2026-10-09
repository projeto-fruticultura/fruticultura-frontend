import { apiRequest } from '@/services/api'
import type { AlertasResposta } from '@/types/api'

export const alertaService = {
  // 404 = backend sem a rota de alertas; quem chama trata como "alertas indisponiveis".
  listar(filtros: { propriedadeId?: number; loteId?: number } = {}) {
    const consulta = new URLSearchParams()
    if (filtros.propriedadeId) consulta.set('propriedadeId', String(filtros.propriedadeId))
    if (filtros.loteId) consulta.set('loteId', String(filtros.loteId))
    const texto = consulta.toString()
    return apiRequest<AlertasResposta>(`/alertas${texto ? `?${texto}` : ''}`)
  },
}
