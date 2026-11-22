import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, TrendingUp } from 'lucide-react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { CabecalhoProdutor, Campo, EstadoVazio, botaoSecundario, campo, cartao } from '@/components/app/produtor/ProdutorUi'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '@/lib/formatar'
import { mediaComparavel } from '@/lib/indicadoresProdutor'
import { LIMITE_COTACOES, PRODUTOS_MERCADO, nomeSerie, serieComparavel } from '@/lib/seriesMercado'
import { UFS } from '@/lib/ufs'
import { ApiError } from '@/services/api'
import { precoService } from '@/services/precoService'
import type { PrecoResposta, ProdutoMercado } from '@/types/api'

const PERIODOS = [7, 30, 90] as const

export default function Mercado() {
  const [produto, setProduto] = useState<ProdutoMercado>('MANGA')
  const [uf, setUf] = useState('PE')
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(30)
  const [serie, setSerie] = useState('')
  const [dados, setDados] = useState<PrecoResposta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState(0)
  const pedido = useRef(0)

  useEffect(() => {
    const atual = ++pedido.current
    // Primeiro descarta dados da seleção anterior, para não mostrar uma cotação incorreta enquanto consulta.
    setCarregando(true)
    setErro('')
    setDados(null)
    setSerie('')
    void precoService.consultar(produto, uf, LIMITE_COTACOES)
      .then((resposta) => { if (pedido.current === atual) setDados(resposta) })
      .catch((error: unknown) => {
        if (pedido.current !== atual) return
        if (error instanceof ApiError && error.status === 503) setErro('A fonte de preços está temporariamente indisponível e não existe uma cotação em cache.')
        else setErro(error instanceof Error ? error.message : 'Não foi possível consultar as cotações.')
      })
      .finally(() => { if (pedido.current === atual) setCarregando(false) })
    return () => { pedido.current += 1 }
  }, [produto, uf, versao])

  const series = useMemo(() => dados ? serieComparavel(dados, periodo) : [], [dados, periodo])
  const grupo = series.find((s) => s.chave === serie) ?? series[0]
  const ultima = grupo?.registros[grupo.registros.length - 1]
  const variacao = ultima && grupo ? mediaComparavel(ultima.preco, grupo.registros.map((r) => r.preco)) : null
  const media = grupo && grupo.registros.length > 0 ? grupo.registros.reduce((s, r) => s + r.preco, 0) / grupo.registros.length : null
  const pontos = grupo?.registros.map((r) => ({ data: formatarData(r.data), preco: r.preco })) ?? []

  return <AppShell section="mercado">
    <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
      <PageBreadcrumb items={[{ label: 'Painel', to: '/painel' }, { label: 'Mercado' }]} />
      <CabecalhoProdutor titulo="Mercado e cotações" descricao="Compare referências de preços agrícolas com a mesma variedade, CEASA e unidade de negociação."
        acao={<button type="button" className={botaoSecundario} disabled={carregando} onClick={() => setVersao((v) => v + 1)}><RefreshCw size={16} className={carregando ? 'animate-spin' : ''}/> Atualizar</button>} />
      <section className={cartao} aria-labelledby="filtros-mercado">
        <h2 id="filtros-mercado" className="mb-4 text-base font-semibold text-[#1d2b23]">Consultar cotações</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Campo rotulo="Produto"><select className={campo} value={produto} onChange={(e) => setProduto(e.target.value as ProdutoMercado)}>{PRODUTOS_MERCADO.map((p) => <option value={p.valor} key={p.valor}>{p.texto}</option>)}</select></Campo>
          <Campo rotulo="UF"><select className={campo} value={uf} onChange={(e) => setUf(e.target.value)}>{UFS.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}</select></Campo>
          <Campo rotulo="Histórico"><select className={campo} value={periodo} onChange={(e) => { setPeriodo(Number(e.target.value) as (typeof PERIODOS)[number]); setSerie('') }}>
            {PERIODOS.map((dias) => <option key={dias} value={dias}>Últimos {dias} dias</option>)}</select></Campo>
          <Campo rotulo="Série / CEASA"><select className={campo} value={grupo?.chave ?? ''} disabled={series.length === 0} onChange={(e) => setSerie(e.target.value)}>
            {series.length === 0 ? <option value="">Nenhuma série encontrada</option> : series.map((s) => {
              const referencia = s.registros[s.registros.length - 1]
              return <option value={s.chave} key={s.chave}>{nomeSerie(referencia)}</option>
            })}</select></Campo>
        </div>
        <p className="mt-3 text-xs text-[#526158]">
          A consulta solicita até {LIMITE_COTACOES} cotações recentes por produto e UF. A média usa as cotações disponíveis da série no intervalo selecionado.
        </p>
      </section>
      {carregando ? <div role="status" className="mt-4">Consultando dados de mercado...</div> : erro ? <div className="mt-4"><FeedbackMessage variant="error">{erro}</FeedbackMessage></div> : !dados || !ultima || !grupo ? <div className="mt-4"><EstadoVazio>Sem cotação no período selecionado. Tente outro produto, UF ou intervalo.</EstadoVazio></div> : <>
        {dados.desatualizado ? <div className="mt-4"><FeedbackMessage variant="info">As cotações exibidas são dados em cache e podem estar desatualizadas.</FeedbackMessage></div> : null}
        <section className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Indicadores de mercado">
          <article className={cartao}><p className="text-xs font-semibold text-[#6f7c74]">Preço mais recente</p><p className="mt-2 text-2xl font-semibold text-[#145a37]">{formatarMoeda(ultima.preco)}</p><p className="mt-1 text-xs text-[#6f7c74]">por {ultima.unidade} · {formatarData(ultima.data)}</p></article>
          <article className={cartao}><p className="text-xs font-semibold text-[#6f7c74]">Média das cotações disponíveis</p><p className="mt-2 text-2xl font-semibold text-[#1b2821]">{media === null || grupo.registros.length < 2 ? '—' : formatarMoeda(media)}</p><p className="mt-1 text-xs text-[#6f7c74]">{grupo.registros.length} registro(s) da mesma série</p></article>
          <article className={cartao}><p className="flex items-center gap-2 text-xs font-semibold text-[#6f7c74]"><TrendingUp size={16} aria-hidden="true"/> Variação vs. média</p>
            <p className={`mt-2 text-2xl font-semibold ${variacao !== null && variacao < 0 ? 'text-red-700' : 'text-[#145a37]'}`}>{variacao === null ? '—' : `${variacao >= 0 ? '+' : ''}${formatarNumero(variacao, 2)}%`}</p>
            <p className="mt-1 text-xs text-[#6f7c74]">{variacao === null ? 'Histórico comparável insuficiente.' : 'Mesmo produto, variedade, CEASA, UF e unidade.'}</p>
          </article>
        </section>
        <section className={`${cartao} mt-4`} aria-labelledby="grafico-mercado">
          <h2 id="grafico-mercado" className="text-base font-semibold text-[#1d2b23]">Histórico de preços</h2>
          <p className="mt-1 text-xs text-[#6f7c74]">{ultima.produto} · {ultima.variedade || 'Variedade não informada'} · {ultima.ceasa} / {ultima.uf} · por {ultima.unidade}</p>
          {pontos.length < 2 ? <p className="mt-5 text-sm text-[#6f7c74]">Histórico insuficiente para exibir a tendência. São necessárias pelo menos duas cotações.</p> :
            <div role="img" aria-label={`Gráfico de ${pontos.length} cotações de preço por ${ultima.unidade}`} className="mt-6 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={pontos} margin={{ top: 10, right: 10, bottom: 10, left: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ece6"/><XAxis dataKey="data" tick={{ fill: '#6f7c74', fontSize: 11 }}/><YAxis tick={{ fill: '#6f7c74', fontSize: 11 }} tickFormatter={(n) => `R$ ${formatarNumero(Number(n), 2)}`} width={75}/>
                <Tooltip formatter={(value) => [formatarMoeda(Number(value)), 'Cotação']}/><Line dataKey="preco" type="monotone" stroke="#168150" strokeWidth={3} dot={{ r: 3 }}/>
              </LineChart></ResponsiveContainer>
            </div>}
        </section>
        <section className={`${cartao} mt-4`} aria-labelledby="tabela-mercado">
          <h2 id="tabela-mercado" className="mb-4 text-base font-semibold text-[#1d2b23]">Cotações da série</h2>
          <div className="overflow-x-auto rounded-xl border border-[#e6ece8]"><table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <caption className="sr-only">Registros comparáveis da série de preços selecionada</caption>
            <thead className="bg-[#f3f7f4] text-[#435249]"><tr><th scope="col" className="px-4 py-3">Data</th><th scope="col" className="px-4 py-3">Variedade</th><th scope="col" className="px-4 py-3">CEASA / UF</th><th scope="col" className="px-4 py-3">Preço / unidade</th></tr></thead>
            <tbody className="divide-y divide-[#edf1ee]">{[...grupo.registros].reverse().map((r, indice) => <tr key={`${r.data}-${r.preco}-${indice}`}><td className="px-4 py-3">{formatarData(r.data)}</td><td className="px-4 py-3">{r.variedade ?? 'Não informada'}</td><td className="px-4 py-3">{r.ceasa} / {r.uf}</td><td className="px-4 py-3 font-semibold">{formatarMoeda(r.preco)} / {r.unidade}</td></tr>)}</tbody>
          </table></div>
        </section>
        <p className="mt-4 text-xs leading-5 text-[#75827a]">Fonte: {dados.fonte} · Origem: {dados.origem} · Consultado em: {formatarDataHora(dados.consultadoEn)}. Preços são referências, não ofertas de compra ou garantia de exportação.</p>
      </>}
    </main>
  </AppShell>
}
