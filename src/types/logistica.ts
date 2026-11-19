/** Dados do planejamento de transporte. O servidor controla a autorização e a persistência. */
export type SituacaoLogistica = 'PLANEJADA' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADA'

export type ModalLogistica = 'RODOVIARIO' | 'FERROVIARIO' | 'AEREO' | 'MARITIMO'

export interface LogisticaRegistro {
  id: number
  propriedadeId: number | null
  origem: string
  destino: string
  modal: string
  transportadora: string | null
  custo: number | null
  situacao: SituacaoLogistica
  tempoEstimadoHoras: number | null
  exigeCadeiaFrio: boolean | null
  colhidoEm: string | null
  resfriadoEm: string | null
  temperaturaResfriamentoC: number | null
}

export interface LogisticaPayload {
  propriedadeId: number
  origem: string
  destino: string
  modal: ModalLogistica
  transportadora: string | null
  custo: number
  situacao: SituacaoLogistica
  tempoEstimadoHoras: number | null
}
