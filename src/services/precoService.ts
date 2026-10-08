import { apiRequest } from '@/services/api'
import type { PrecoResposta, ProdutoMercado } from '@/types/api'

export const precoService = {
  // 400 se o produto nao for um dos 5; 503 se a CONAB estiver fora do ar e sem cache.
  consultar(produto: ProdutoMercado, uf: string, limite = 5) {
    const consulta = new URLSearchParams({ produto, uf, limite: String(limite) })
    return apiRequest<PrecoResposta>(`/precos?${consulta.toString()}`)
  },
}
