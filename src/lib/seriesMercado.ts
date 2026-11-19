import type { PrecoRegistro, PrecoResposta } from '@/types/api'

function chaveSerie(registro: PrecoRegistro) {
  return [registro.produto, registro.variedade ?? '', registro.uf, registro.ceasa, registro.unidade].join('||')
}

function dataCotacao(valor: string) {
  const ms = Date.parse(valor.length <= 10 ? `${valor}T12:00:00` : valor)
  return Number.isFinite(ms) ? ms : null
}

/** Comparações exigem a mesma variedade, mercado, UF e unidade; outras CEASAs não entram na média. */
export function serieComparavel(resposta: PrecoResposta, periodoDias: number, agora = Date.now()) {
  const todos = resposta.precoAtual ? [resposta.precoAtual, ...resposta.historico] : [...resposta.historico]
  const series = new Map<string, PrecoRegistro[]>()
  for (const registro of todos) {
    const ms = dataCotacao(registro.data)
    if (ms === null || ms > agora + 24 * 60 * 60 * 1000 || ms < agora - periodoDias * 24 * 60 * 60 * 1000) continue
    const chave = chaveSerie(registro)
    const grupo = series.get(chave) ?? []
    // Remove duplicações da cotação mais recente que também aparece no histórico.
    if (!grupo.some((item) => item.data === registro.data && item.preco === registro.preco)) grupo.push(registro)
    series.set(chave, grupo)
  }
  return [...series.entries()].map(([chave, registros]) => ({ chave, registros: registros.sort((a, b) => (dataCotacao(a.data) ?? 0) - (dataCotacao(b.data) ?? 0)) }))
    .sort((a, b) => (dataCotacao(b.registros[b.registros.length - 1].data) ?? 0) - (dataCotacao(a.registros[a.registros.length - 1].data) ?? 0))
}
