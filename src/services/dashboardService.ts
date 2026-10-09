import { apiRequest } from '@/services/api'

export interface DashboardResumo {
  ultimaLeitura: {
    sensorId: number
    sensorCodigo: string
    temperatura: number
    umidade: number
    dataHoraLeitura: string
  } | null
  totalAlertas: number
}

export interface MediaDashboard {
  periodo: string
  temperaturaMedia: number
  umidadeMedia: number
  quantidade: number
}

export interface DashboardMedias {
  agrupar: 'hora' | 'dia'
  fuso: string
  de: string
  ate: string
  dados: MediaDashboard[]
}

export interface FiltrosDashboard {
  propriedadeId?: number
  culturaId?: number
  sensorId?: number
}

export interface FiltrosMedias extends FiltrosDashboard {
  agrupar?: 'hora' | 'dia'
  de?: string
  ate?: string
}

function montarQuery(filtros: object): string {
  const query = new URLSearchParams()

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== '') {
      query.set(chave, String(valor))
    }
  })

  const resultado = query.toString()

  return resultado ? `?${resultado}` : ''
}

export const dashboardService = {
  resumo(filtros: FiltrosDashboard = {}): Promise<DashboardResumo> {
    return apiRequest<DashboardResumo>(
      `/dashboard/resumo${montarQuery(filtros)}`,
    )
  },

  medias(filtros: FiltrosMedias = {}): Promise<DashboardMedias> {
    return apiRequest<DashboardMedias>(
      `/dashboard/medias${montarQuery({
        agrupar: filtros.agrupar ?? 'hora',
        propriedadeId: filtros.propriedadeId,
        culturaId: filtros.culturaId,
        sensorId: filtros.sensorId,
        de: filtros.de,
        ate: filtros.ate,
      })}`,
    )
  },
}

