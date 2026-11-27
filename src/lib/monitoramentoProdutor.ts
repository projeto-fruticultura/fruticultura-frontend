import type { AreasProdutor, MediaDashboard } from '../services/dashboardService'

export function serieHoraria(dados: MediaDashboard[]) {
  return dados.filter((d) => Number.isFinite(Date.parse(d.periodo)) && d.quantidade > 0)
    .map((d) => ({ instante: Date.parse(d.periodo), temperatura: Number.isFinite(d.temperaturaMedia) ? d.temperaturaMedia : null, umidade: Number.isFinite(d.umidadeMedia) ? d.umidadeMedia : null }))
    .sort((a, b) => a.instante - b.instante)
}

export function distribuicaoAreas(areas: AreasProdutor) {
  const itens = [
    { nome: 'Sob proteção', valor: areas.protecao, cor: '#168150' },
    { nome: 'Sob risco', valor: areas.risco, cor: '#dc2626' },
    { nome: 'Dados insuficientes', valor: areas.semDados, cor: '#94a3b8' },
  ]
  return itens.every((i) => Number.isFinite(i.valor) && i.valor >= 0) ? itens : null
}
