import { apiRequest } from '@/services/api'
import type { LeiturasFiltros, LeiturasResposta } from '@/types/api'

export const leituraService = {
  // So consulta. O dono vem sempre do login; aqui so se filtra o que o usuario ja pode ver.
  listar(filtros: LeiturasFiltros = {}) {
    const consulta = new URLSearchParams()
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== undefined) consulta.set(chave, String(valor))
    }
    const texto = consulta.toString()
    return apiRequest<LeiturasResposta>(`/leituras${texto ? `?${texto}` : ''}`)
  },
}
