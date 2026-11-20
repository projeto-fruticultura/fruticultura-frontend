import type { LogisticaRegistro, SituacaoLogistica } from '@/types/logistica'

function objeto(valor: unknown): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new Error('Resposta da API de logística inválida.')
  }
  return valor as Record<string, unknown>
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

const situacoes: SituacaoLogistica[] = ['PLANEJADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA']

function situacaoNormalizada(valor: unknown): SituacaoLogistica {
  const normalizado = texto(valor)?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, '_')
  if (normalizado && situacoes.includes(normalizado as SituacaoLogistica)) return normalizado as SituacaoLogistica
  throw new Error('A API retornou uma situação de frete não reconhecida.')
}

/** Conversão explícita e validada: nenhuma informação ausente é inventada. */
export function decodificarLogistica(payload: unknown): LogisticaRegistro[] {
  const base = Array.isArray(payload) ? payload : objeto(payload)
  const lista = Array.isArray(base) ? base : (base.dados ?? base.registros ?? base.items)
  if (!Array.isArray(lista)) throw new Error('A API não retornou uma lista de fretes válida.')
  return lista.map((valor) => {
    const v = objeto(valor)
    const id = numero(v.id)
    const origem = texto(v.origem)
    const destino = texto(v.destino)
    const modal = texto(v.modal)
    if (!id || !origem || !destino || !modal) throw new Error('Registro de logística com campos obrigatórios inválidos.')
    return {
      id,
      propriedadeId: numero(v.propriedadeId),
      origem,
      destino,
      modal,
      transportadora: texto(v.transportadora),
      custo: numero(v.custo),
      situacao: situacaoNormalizada(v.situacao),
      tempoEstimadoHoras: numero(v.tempoEstimadoHoras),
      exigeCadeiaFrio: typeof v.exigeCadeiaFrio === 'boolean' ? v.exigeCadeiaFrio : null,
      colhidoEm: texto(v.colhidoEm),
      resfriadoEm: texto(v.resfriadoEm),
      temperaturaResfriamentoC: numero(v.temperaturaResfriamentoC),
    }
  })
}
