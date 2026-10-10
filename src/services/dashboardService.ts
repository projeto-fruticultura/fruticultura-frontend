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
  sensoresAtivos: number
  totalLeituras: number
  temperaturaMedia: number | null
  umidadeMedia: number | null
  janelaMediasHoras: number
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
  loteId?: number
  culturaId?: number
  sensorId?: number
}

export interface FiltrosMedias extends FiltrosDashboard {
  agrupar?: 'hora' | 'dia'
  unidade?: 'hour' | 'day'
  de?: string
  ate?: string
}

function sanitizarId(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === '') return undefined
  const num = Number(valor)
  return Number.isNaN(num) ? undefined : num
}

export const dashboardService = {
  async resumo(filtros: FiltrosDashboard = {}): Promise<DashboardResumo> {
    const query = new URLSearchParams()
    const pId = sanitizarId(filtros.propriedadeId)
    const lId = sanitizarId(filtros.loteId)
    const cId = sanitizarId(filtros.culturaId)
    const sId = sanitizarId(filtros.sensorId)

    if (pId) query.set('propriedadeId', String(pId))
    if (lId) query.set('loteId', String(lId))
    if (cId) query.set('culturaId', String(cId))
    if (sId) query.set('sensorId', String(sId))

    const queryString = query.toString() ? `?${query.toString()}` : ''

    return await apiRequest<DashboardResumo>(`/dashboard/resumo${queryString}`)
  },

  async medias(filtros: FiltrosMedias = {}): Promise<DashboardMedias> {
    const query = new URLSearchParams()
    
    // O back-end exige estritamente "hora" ou "dia" (em português)
    query.set('agrupar', filtros.agrupar === 'dia' ? 'dia' : 'hora')

    const pId = sanitizarId(filtros.propriedadeId)
    const lId = sanitizarId(filtros.loteId)
    const cId = sanitizarId(filtros.culturaId)
    const sId = sanitizarId(filtros.sensorId)

    if (pId) query.set('propriedadeId', String(pId))
    if (lId) query.set('loteId', String(lId))
    if (cId) query.set('culturaId', String(cId))
    if (sId) query.set('sensorId', String(sId))

    if (filtros.de) query.set('de', filtros.de)
    if (filtros.ate) query.set('ate', filtros.ate)

    const queryString = `?${query.toString()}`

    return await apiRequest<DashboardMedias>(`/dashboard/medias${queryString}`)
  },
}