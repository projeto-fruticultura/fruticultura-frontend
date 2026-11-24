import type { Alerta, Leitura, Lote, PropriedadeResumo, Sensor } from '@/types/api'
import type { LogisticaRegistro } from '@/types/logistica'

export const UMA_HORA_MS = 60 * 60 * 1000

export type CondicaoPropriedade = 'ALERTA' | 'SEM_ALERTAS' | 'LEITURA_ANTIGA' | 'SEM_DADOS' | 'NAO_VERIFICADO'

export function leituraAntiga(data: string | null | undefined, agora = Date.now()) {
  if (!data) return true
  const ms = Date.parse(data)
  return !Number.isFinite(ms) || agora - ms > UMA_HORA_MS
}

export function condicaoPropriedade(
  propriedade: PropriedadeResumo,
  lotes: Lote[],
  sensores: Sensor[],
  leituras: Leitura[] | null,
  alertas: Alerta[] | null,
  agora = Date.now(),
): CondicaoPropriedade {
  if (alertas === null || leituras === null) return 'NAO_VERIFICADO'
  if (alertas.some((alerta) => alerta.propriedadeId === propriedade.id)) return 'ALERTA'
  const lotesDaPropriedade = new Set(lotes.filter((lote) => lote.propriedadeId === propriedade.id).map((lote) => lote.id))
  const sensoresDaPropriedade = sensores.filter((sensor) => sensor.status === 'ATIVO' && lotesDaPropriedade.has(sensor.loteId))
  if (sensoresDaPropriedade.length === 0) return 'SEM_DADOS'
  const leiturasPorSensor = new Map<number, Leitura[]>()
  for (const leitura of leituras) {
    if (!sensoresDaPropriedade.some((sensor) => sensor.id === leitura.sensorId)) continue
    const lista = leiturasPorSensor.get(leitura.sensorId) ?? []
    lista.push(leitura)
    leiturasPorSensor.set(leitura.sensorId, lista)
  }
  if (leiturasPorSensor.size === 0) return 'SEM_DADOS'
  if (sensoresDaPropriedade.some((sensor) => !leiturasPorSensor.has(sensor.id))) return 'NAO_VERIFICADO'
  if (sensoresDaPropriedade.some((sensor) => !(leiturasPorSensor.get(sensor.id) ?? []).some((leitura) => !leituraAntiga(leitura.dataHoraLeitura, agora)))) return 'LEITURA_ANTIGA'
  return 'SEM_ALERTAS'
}

export function alertasObservadosHoje(alertas: Alerta[], agora = new Date()) {
  const data = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const hoje = data(agora)
  return alertas.filter((a) => Number.isFinite(Date.parse(a.dataHoraLeitura)) && data(new Date(a.dataHoraLeitura)) === hoje).length
}

export type SituacaoFrio = 'SEM_EXIGENCIA' | 'PENDENTE' | 'CONFORME' | 'ATENCAO'

/** Somente avalia quando a exigência e as medições reais foram informadas pela API. */
export function avaliarCadeiaFrio(registro: LogisticaRegistro): SituacaoFrio {
  if (registro.exigeCadeiaFrio === false) return 'SEM_EXIGENCIA'
  if (registro.exigeCadeiaFrio === null) return 'PENDENTE'
  const inicio = registro.colhidoEm ? Date.parse(registro.colhidoEm) : NaN
  const fim = registro.resfriadoEm ? Date.parse(registro.resfriadoEm) : NaN
  const temp = registro.temperaturaResfriamentoC
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || temp === null || fim < inicio) return 'PENDENTE'
  return fim - inicio < 6 * UMA_HORA_MS && temp >= 0 && temp <= 10 ? 'CONFORME' : 'ATENCAO'
}

export function mediaComparavel(precoAtual: number, historico: number[]): number | null {
  const validos = historico.filter((valor) => Number.isFinite(valor) && valor >= 0)
  if (!Number.isFinite(precoAtual) || precoAtual < 0 || validos.length < 2) return null
  const media = validos.reduce((total, v) => total + v, 0) / validos.length
  return media > 0 ? ((precoAtual - media) / media) * 100 : null
}
