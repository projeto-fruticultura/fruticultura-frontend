import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Cpu, Leaf, MapPinned, RefreshCw, ShieldAlert, Sprout, TrendingUp, Truck } from 'lucide-react'
import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { AlertasPainel, type EstadoAlertas } from '@/components/app/dashboard/AlertasPainel'
import { CabecalhoProdutor, EstadoVazio, IndicadorProdutor, botaoSecundario, cartao } from '@/components/app/produtor/ProdutorUi'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { formatarData, formatarDataHora } from '@/lib/formatar'
import { alertasObservadosHoje, condicaoPropriedade, leituraAntiga, type CondicaoPropriedade } from '@/lib/indicadoresProdutor'
import { alertaService } from '@/services/alertaService'
import { dashboardService, type DashboardResumo } from '@/services/dashboardService'
import { leituraService } from '@/services/leituraService'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import { sensorService } from '@/services/sensorService'
import type { Alerta, Leitura, Lote, PropriedadeResumo, Sensor } from '@/types/api'

interface DadosPainel {
  propriedades: PropriedadeResumo[]
  lotes: Lote[]
  sensores: Sensor[]
  leituras: Leitura[] | null
  alertas: Alerta[] | null
  resumo: DashboardResumo | null
  avisos: string[]
}

const estadoInicial: DadosPainel = { propriedades: [], lotes: [], sensores: [], leituras: null, alertas: null, resumo: null, avisos: [] }

const ESTADOS: Record<CondicaoPropriedade, { nome: string; classe: string }> = {
  ALERTA: { nome: 'Atenção', classe: 'bg-amber-100 text-amber-900' },
  SEM_ALERTAS: { nome: 'Sem alertas nas leituras consultadas', classe: 'bg-emerald-100 text-emerald-900' },
  LEITURA_ANTIGA: { nome: 'Leitura desatualizada', classe: 'bg-amber-100 text-amber-900' },
  SEM_DADOS: { nome: 'Sem leituras', classe: 'bg-slate-100 text-slate-700' },
  NAO_VERIFICADO: { nome: 'Não verificado', classe: 'bg-slate-100 text-slate-700' },
}

export default function PainelProdutor() {
  const { usuario } = useAuth()
  const [dados, setDados] = useState<DadosPainel>(estadoInicial)
  const [carregando, setCarregando] = useState(true)
  const [propriedadeFiltro, setPropriedadeFiltro] = useState('')
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setCarregando(true)
      const respostas = await Promise.allSettled([
        propriedadeService.listar(),
        loteService.listar(),
        sensorService.listar(),
        leituraService.listar({ limite: 100 }),
        alertaService.listar(),
        dashboardService.resumo(),
      ] as const)
      if (!ativo) return
      const avisos: string[] = []
      const [propriedades, lotes, sensores, leituras, alertas, resumo] = respostas
      if (propriedades.status === 'rejected') avisos.push('Não foi possível carregar as propriedades.')
      if (lotes.status === 'rejected') avisos.push('Não foi possível carregar os lotes.')
      if (sensores.status === 'rejected') avisos.push('Não foi possível carregar os sensores.')
      if (leituras.status === 'rejected') avisos.push('Não foi possível carregar as leituras.')
      if (alertas.status === 'rejected') avisos.push('Os alertas estão temporariamente indisponíveis.')
      if (resumo.status === 'rejected') avisos.push('Os indicadores agregados estão temporariamente indisponíveis.')
      setDados({
        propriedades: propriedades.status === 'fulfilled' ? propriedades.value : [],
        lotes: lotes.status === 'fulfilled' ? lotes.value : [],
        sensores: sensores.status === 'fulfilled' ? sensores.value : [],
        leituras: leituras.status === 'fulfilled' ? leituras.value.dados : null,
        alertas: alertas.status === 'fulfilled' ? alertas.value.alertas : null,
        resumo: resumo.status === 'fulfilled' ? resumo.value : null,
        avisos,
      })
      setCarregando(false)
    }
    void carregar()
    return () => { ativo = false }
  }, [recarregar])

  const propriedades = useMemo(() =>
    propriedadeFiltro ? dados.propriedades.filter((p) => String(p.id) === propriedadeFiltro) : dados.propriedades,
    [dados.propriedades, propriedadeFiltro],
  )
  const lotes = useMemo(() => {
    if (!propriedadeFiltro) return dados.lotes
    return dados.lotes.filter((lote) => String(lote.propriedadeId) === propriedadeFiltro)
  }, [dados.lotes, propriedadeFiltro])
  const sensores = useMemo(() => {
    const ids = new Set(lotes.map((lote) => lote.id))
    return dados.sensores.filter((sensor) => ids.has(sensor.loteId))
  }, [dados.sensores, lotes])
  const alertasFiltrados = propriedadeFiltro
    ? dados.alertas?.filter((alerta) => String(alerta.propriedadeId) === propriedadeFiltro) ?? null
    : dados.alertas
  const ultimoInstante = dados.resumo?.ultimaLeitura?.dataHoraLeitura
    ?? (dados.leituras?.length ? [...dados.leituras].sort((a, b) => Date.parse(b.dataHoraLeitura) - Date.parse(a.dataHoraLeitura))[0]?.dataHoraLeitura : null)
  const dataColheita = [...lotes].filter((lote) => lote.colheitaEstimada && lote.colheitaEstimada >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.colheitaEstimada ?? '').localeCompare(b.colheitaEstimada ?? ''))[0]?.colheitaEstimada
  const estadoAlertas: EstadoAlertas = dados.leituras === null || dados.leituras.length === 0 || alertasFiltrados === null
    ? { status: 'indisponivel' }
    : { status: 'ok', total: alertasFiltrados.length, alertas: alertasFiltrados }

  return <AppShell section="overview">
    <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
      <PageBreadcrumb items={[{ label: 'Painel do produtor' }]} />
      <CabecalhoProdutor titulo={`Olá, ${usuario?.nome?.trim().split(/\s+/)[0] ?? 'Produtor'}`}
        descricao="Sua produção em um só lugar: acompanhe propriedades, sensores, alertas e decisões de escoamento."
        acao={<button type="button" disabled={carregando} onClick={() => setRecarregar((n) => n + 1)} className={botaoSecundario}>
          <RefreshCw size={16} aria-hidden="true" className={carregando ? 'animate-spin' : ''} /> Atualizar
        </button>} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce4df] bg-white px-4 py-3">
        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#526158]">
          Propriedade
          <select className="min-h-10 min-w-[190px] rounded-lg border border-[#dce4df] bg-[#f6f8f7] px-3 text-[#35453c]" value={propriedadeFiltro}
            onChange={(e) => setPropriedadeFiltro(e.target.value)}>
            <option value="">Todas as propriedades</option>
            {dados.propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <span className="text-xs text-[#6f7c74]">Última leitura: {formatarDataHora(ultimoInstante)}
          {ultimoInstante && leituraAntiga(ultimoInstante) ? <strong className="ml-2 text-amber-800">Há mais de 60 min</strong> : null}
        </span>
      </div>
      {dados.avisos.length > 0 ? <div className="mb-5 space-y-2">{dados.avisos.map((aviso) => <FeedbackMessage variant="error" key={aviso}>{aviso}</FeedbackMessage>)}</div> : null}
      {carregando ? <div className="mb-5" role="status">Carregando informações da produção...</div> : null}
      <section className={cartao} aria-labelledby="indicadores-produtor">
        <h2 id="indicadores-produtor" className="mb-4 text-base font-semibold text-[#1d2b23]">Visão executiva</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <IndicadorProdutor nome="Propriedades cadastradas" valor={carregando ? '—' : dados.avisos.some((v) => v.includes('propriedades')) ? '—' : propriedades.length} icone={Leaf} />
          <IndicadorProdutor nome="Lotes" valor={carregando ? '—' : dados.avisos.some((v) => v.includes('lotes')) ? '—' : lotes.length} icone={Sprout} />
          <IndicadorProdutor nome="Sensores ativos" valor={carregando || dados.avisos.some((v) => v.includes('sensores')) ? '—' : sensores.filter((s) => s.status === 'ATIVO').length} icone={Cpu} />
          <IndicadorProdutor nome="Alertas observados hoje" valor={carregando ? '—' : alertasFiltrados ? alertasObservadosHoje(alertasFiltrados) : '—'} icone={AlertTriangle} ajuda="Apenas alertas de últimas leituras disponíveis; não é histórico completo do dia." />
          <IndicadorProdutor nome="Área sob proteção" valor="—" icone={MapPinned} ajuda="A API ainda não disponibiliza esta classificação de área." />
          <IndicadorProdutor nome="Área sob risco" valor="—" icone={ShieldAlert} ajuda="Sem indicador de risco calculado e validado." />
          <IndicadorProdutor nome="Variação de mercado" valor="—" icone={TrendingUp} ajuda="Consulte a média e a variação por série na tela Mercado." />
          <IndicadorProdutor nome="Próxima colheita estimada" valor={dataColheita ? formatarData(dataColheita) : '—'} icone={CalendarDays} ajuda="Estimativa cadastrada no lote; não é recomendação agronômica." />
        </div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className={cartao} aria-labelledby="propriedades-produtor">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="propriedades-produtor" className="text-base font-semibold text-[#1d2b23]">Situação das propriedades</h2>
            <Link className="text-sm font-semibold text-[#087a49] hover:underline" to="/propriedades">Ver todas</Link></div>
          {propriedades.length === 0 ? <EstadoVazio>Nenhuma propriedade disponível para esta seleção.</EstadoVazio> :
            <ul className="divide-y divide-[#e6ece8]">{propriedades.slice(0, 6).map((p) => {
              const estado = ESTADOS[condicaoPropriedade(p, dados.lotes, dados.sensores, dados.leituras, dados.alertas)]
              return <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><Link className="text-sm font-semibold text-[#2d3a33] hover:text-[#087a49] hover:underline" to={`/propriedades/${p.id}`}>{p.nome}</Link>
                  <p className="mt-0.5 text-xs text-[#7a8780]">{p.cidade} / {p.uf} · {p.totalLotes} lote(s)</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.classe}`}>{estado.nome}</span>
              </li>
            })}</ul>}
          <p className="mt-3 text-xs text-[#7a8780]">Situação baseada nas leituras e nos alertas consultados; ausência de alerta não comprova ausência de risco.</p>
        </section>
        <section className={cartao} aria-labelledby="planejamento-produtor">
          <h2 id="planejamento-produtor" className="text-base font-semibold text-[#1d2b23]">Planejamento e decisões</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-[#f6f9f7] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#638071]">Janela recomendada de colheita</p>
              <p className="mt-2 text-sm font-medium">Indisponível — depende de fase fenológica, previsão e modelo validado.</p>
              {dataColheita ? <p className="mt-1 text-xs text-[#6f7c74]">Há uma data estimada de colheita cadastrada: {formatarData(dataColheita)}.</p> : null}</div>
            <div className="rounded-xl bg-[#f6f9f7] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#638071]">Janela recomendada de exportação</p>
              <p className="mt-2 text-sm font-medium">Indisponível — requer integração com tempo de transporte, cotações e cadeia do frio.</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><Link className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#087a49] px-4 py-2 text-sm font-semibold text-white hover:bg-[#075d39]" to="/logistica"><Truck size={16}/> Planejar transporte</Link>
            <Link className={botaoSecundario} to="/mercado"><TrendingUp size={16}/> Ver cotações</Link></div>
        </section>
      </div>
      <div className="mt-4"><AlertasPainel estado={carregando ? { status: 'carregando' } : estadoAlertas} /></div>
      <p className="mt-4 text-xs leading-5 text-[#75827a]">Dados de sensores representam últimas leituras recebidas, não monitoramento contínuo em tempo real. Alertas climáticos não são diagnósticos fitossanitários.</p>
    </main>
  </AppShell>
}
