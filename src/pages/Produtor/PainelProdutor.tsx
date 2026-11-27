import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Cpu,
  Droplets,
  RefreshCw,
  Thermometer,
  Leaf,
  MapPinned,
  ShieldAlert,
  Sprout,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { MetricCard } from '@/components/app/dashboard/MetricCard'
import { MonitoramentoProdutor } from '@/components/app/produtor/MonitoramentoProdutor'
import { AppShell } from '@/components/app/AppShell'
import {
  AlertasPainel,
  type EstadoAlertas,
} from '@/components/app/dashboard/AlertasPainel'
import {
  EstadoVazio,
  botaoSecundario,
  cartao,
} from '@/components/app/produtor/ProdutorUi'
import { VariacaoMercado } from '@/components/app/produtor/VariacaoMercado'
import { JanelasProdutor } from '@/components/app/produtor/JanelasProdutor'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { formatarData, formatarDataHora, formatarNumero } from '@/lib/formatar'
import {
  alertasObservadosHoje,
  condicaoPropriedade,
  type CondicaoPropriedade,
} from '@/lib/indicadoresProdutor'
import { alertaService } from '@/services/alertaService'
import {
  dashboardService,
  type AlertasDoDiaProdutor,
  type AreasProdutor,
  type DashboardResumo,
  type DashboardMedias,
} from '@/services/dashboardService'
import { leituraService } from '@/services/leituraService'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import { sensorService } from '@/services/sensorService'
import type {
  Alerta,
  Leitura,
  Lote,
  PropriedadeResumo,
  Sensor,
} from '@/types/api'

const botaoAcaoPrimaria =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 cursor-pointer'

interface DadosPainel {
  propriedades: PropriedadeResumo[]
  lotes: Lote[]
  sensores: Sensor[]
  leituras: Leitura[] | null
  alertas: Alerta[] | null
  avisos: string[]
}

const estadoInicial: DadosPainel = {
  propriedades: [],
  lotes: [],
  sensores: [],
  leituras: null,
  alertas: null,
  avisos: [],
}

const ESTADOS: Record<CondicaoPropriedade, { nome: string; classe: string }> = {
  ALERTA: { nome: 'Atenção', classe: 'bg-amber-100 text-amber-900' },
  SEM_ALERTAS: {
    nome: 'Sem alertas nas leituras consultadas',
    classe: 'bg-emerald-100 text-emerald-900',
  },
  LEITURA_ANTIGA: {
    nome: 'Leitura desatualizada',
    classe: 'bg-amber-100 text-amber-900',
  },
  SEM_DADOS: { nome: 'Sem leituras', classe: 'bg-slate-100 text-slate-700' },
  NAO_VERIFICADO: {
    nome: 'Não verificado',
    classe: 'bg-slate-100 text-slate-700',
  },
}

function tempoAtrasoLeitura(dataHoraIso: string): string | null {
  const instante = Date.parse(dataHoraIso)
  if (!Number.isFinite(instante)) return null

  const diffMs = Date.now() - instante
  const UMA_HORA_MS = 60 * 60 * 1000
  if (diffMs <= UMA_HORA_MS) return null

  const horas = Math.floor(diffMs / UMA_HORA_MS)
  if (horas < 24) {
    return `Há ${horas}h`
  }

  const dias = Math.floor(horas / 24)
  if (dias < 30) {
    return dias === 1 ? 'Há 1 dia' : `Há ${dias} dias`
  }

  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'Há 1 mês' : `Há ${meses} meses`
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
      ] as const)
      if (!ativo) return
      const avisos: string[] = []
      const [propriedades, lotes, sensores, leituras, alertas] = respostas
      if (propriedades.status === 'rejected')
        avisos.push('Não foi possível carregar as propriedades.')
      if (lotes.status === 'rejected')
        avisos.push('Não foi possível carregar os lotes.')
      if (sensores.status === 'rejected')
        avisos.push('Não foi possível carregar os sensores.')
      if (leituras.status === 'rejected')
        avisos.push('Não foi possível carregar as leituras.')
      if (alertas.status === 'rejected')
        avisos.push('Os alertas estão temporariamente indisponíveis.')
      setDados({
        propriedades:
          propriedades.status === 'fulfilled' ? propriedades.value : [],
        lotes: lotes.status === 'fulfilled' ? lotes.value : [],
        sensores: sensores.status === 'fulfilled' ? sensores.value : [],
        leituras: leituras.status === 'fulfilled' ? leituras.value.dados : null,
        alertas: alertas.status === 'fulfilled' ? alertas.value.alertas : null,
        avisos,
      })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [recarregar])

  const chaveConsulta = `${propriedadeFiltro}-${recarregar}`
  const [indicadores, setIndicadores] = useState<{
    chave: string
    resumo: DashboardResumo | null
    medias: DashboardMedias | null
    areas: AreasProdutor | null
    alertasDoDia: AlertasDoDiaProdutor | null
  }>()

  useEffect(() => {
    let ativo = true
    const propriedadeId = propriedadeFiltro
      ? Number(propriedadeFiltro)
      : undefined
    void Promise.allSettled([
      dashboardService.resumo({ propriedadeId }),
      dashboardService.medias({
        propriedadeId,
        agrupar: 'hora',
        de: new Date(Date.now() - 86400000).toISOString(),
        ate: new Date().toISOString(),
      }),
      dashboardService.areasProdutor(propriedadeId),
      dashboardService.alertasDoDiaProdutor(propriedadeId),
    ] as const).then(([resumo, medias, areas, alertasDoDia]) => {
      if (ativo)
        setIndicadores({
          chave: chaveConsulta,
          resumo: resumo.status === 'fulfilled' ? resumo.value : null,
          medias: medias.status === 'fulfilled' ? medias.value : null,
          areas: areas.status === 'fulfilled' ? areas.value : null,
          alertasDoDia:
            alertasDoDia.status === 'fulfilled' ? alertasDoDia.value : null,
        })
    })
    return () => {
      ativo = false
    }
  }, [chaveConsulta, propriedadeFiltro])

  const indicadoresAtuais =
    indicadores?.chave === chaveConsulta ? indicadores : null
  const areas = indicadoresAtuais?.areas
  const alertasDoDia = indicadoresAtuais?.alertasDoDia

  const propriedades = useMemo(
    () =>
      propriedadeFiltro
        ? dados.propriedades.filter((p) => String(p.id) === propriedadeFiltro)
        : dados.propriedades,
    [dados.propriedades, propriedadeFiltro],
  )
  const lotes = useMemo(() => {
    if (!propriedadeFiltro) return dados.lotes
    return dados.lotes.filter(
      (lote) => String(lote.propriedadeId) === propriedadeFiltro,
    )
  }, [dados.lotes, propriedadeFiltro])
  const sensores = useMemo(() => {
    const ids = new Set(lotes.map((lote) => lote.id))
    return dados.sensores.filter((sensor) => ids.has(sensor.loteId))
  }, [dados.sensores, lotes])
  const alertasFiltrados = propriedadeFiltro
    ? dados.alertas?.filter(
        (alerta) => String(alerta.propriedadeId) === propriedadeFiltro,
      ) ?? null
    : dados.alertas
  const ultimoInstante = indicadoresAtuais?.resumo?.ultimaLeitura?.dataHoraLeitura
  const atrasoLeitura = ultimoInstante
    ? tempoAtrasoLeitura(ultimoInstante)
    : null
  const sensoresSelecionados = new Set(sensores.map(({ id }) => id))
  const temLeitura = indicadoresAtuais?.resumo
    ? ultimoInstante != null
    : dados.leituras?.some(({ sensorId }) => sensoresSelecionados.has(sensorId))
  const dataColheita = [...lotes]
    .filter(
      (lote) =>
        lote.colheitaEstimada &&
        lote.colheitaEstimada >= new Date().toISOString().slice(0, 10),
    )
    .sort((a, b) =>
      (a.colheitaEstimada ?? '').localeCompare(b.colheitaEstimada ?? ''),
    )[0]?.colheitaEstimada
  const estadoAlertas: EstadoAlertas =
    !temLeitura || alertasFiltrados === null
      ? { status: 'indisponivel' }
      : {
          status: 'ok',
          total: alertasFiltrados.length,
          alertas: alertasFiltrados,
        }

  const primeiroNome = usuario?.nome?.trim().split(/\s+/)[0] ?? 'Produtor'

  return (
    <AppShell section="overview">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
        <section className="mb-5 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Olá, {primeiroNome}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Sua produção em um só lugar: acompanhe propriedades, sensores,
              alertas e decisões de escoamento.
            </p>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce4df] bg-white px-4 py-3.5 shadow-xs sm:px-5">
          <label className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#526158]">
            <span>Propriedade</span>
            <select
              className="min-h-10 min-w-[210px] rounded-xl border border-[#dce4df] bg-[#f6f8f7] px-3 text-sm font-medium text-[#35453c] transition focus:border-[#009B4D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009B4D]/15"
              value={propriedadeFiltro}
              onChange={(e) => setPropriedadeFiltro(e.target.value)}
            >
              <option value="">Todas as propriedades</option>
              {dados.propriedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
            <div
              className={`inline-flex min-h-10 flex-wrap items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium ${
                atrasoLeitura
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-[#e1e7e3] bg-[#f6f8f7] text-[#35453c]'
              }`}
            >
              <span className="font-semibold text-[#526158]">
                Última leitura:
              </span>
              <span className="tabular-nums">
                {!indicadoresAtuais
                  ? 'Carregando…'
                  : !indicadoresAtuais.resumo
                    ? 'Indisponível'
                    : ultimoInstante
                      ? formatarDataHora(ultimoInstante)
                      : 'Sem leituras'}
              </span>
              {atrasoLeitura ? (
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
                  {atrasoLeitura}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setRecarregar((v) => v + 1)}
              disabled={carregando || !indicadoresAtuais}
              aria-label="Atualizar dados do painel"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-3.5 py-2 text-xs font-semibold text-[#2d3a33] shadow-2xs transition hover:border-[#b8c7be] hover:bg-[#f6f8f7] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={
                  carregando || !indicadoresAtuais
                    ? 'animate-spin text-[#009B4D]'
                    : 'text-[#526158]'
                }
                aria-hidden="true"
              />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {dados.avisos.length > 0 ? (
          <div className="mb-5 space-y-2">
            {dados.avisos.map((aviso) => (
              <FeedbackMessage variant="error" key={aviso}>
                {aviso}
              </FeedbackMessage>
            ))}
          </div>
        ) : null}

        {carregando ? (
          <div className="mb-5 text-sm text-[#68756d]" role="status">
            Carregando informações da produção...
          </div>
        ) : null}

        <section className={cartao} aria-labelledby="indicadores-produtor">
          <h2
            id="indicadores-produtor"
            className="mb-4 text-base font-semibold text-[#1d2b23]"
          >
            Visão executiva
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              accent="bg-[#28d887]"
              label="Propriedades cadastradas"
              value={
                carregando ||
                dados.avisos.some((v) => v.includes('propriedades'))
                  ? '—'
                  : propriedades.length
              }
              icon={Leaf}
            />
            <MetricCard
              accent="bg-[#4aa7e8]"
              label="Lotes"
              value={
                carregando || dados.avisos.some((v) => v.includes('lotes'))
                  ? '—'
                  : lotes.length
              }
              icon={Sprout}
            />
            <MetricCard
              accent="bg-[#9858dd]"
              label="Sensores ativos"
              value={
                carregando || dados.avisos.some((v) => v.includes('sensores'))
                  ? '—'
                  : sensores.filter((s) => s.status === 'ATIVO').length
              }
              icon={Cpu}
            />
            <MetricCard
              accent="bg-[#f2a23d]"
              label={
                alertasDoDia ? 'Alertas do dia' : 'Alertas observados hoje'
              }
              value={
                !indicadoresAtuais
                  ? '—'
                  : alertasDoDia?.total ??
                    (alertasFiltrados
                      ? alertasObservadosHoje(alertasFiltrados)
                      : '—')
              }
              icon={AlertTriangle}
              helper={
                alertasDoDia
                  ? 'Episódios de risco registrados que ocorreram no dia, no horário de Recife.'
                  : 'Alertas das últimas leituras disponíveis.'
              }
            />
            <MetricCard
              accent="bg-[#28d887]"
              label="Área sob proteção"
              value={
                areas ? `${formatarNumero(areas.protecao, 2)} ha` : '—'
              }
              icon={MapPinned}
              helper="Todos os sensores ativos do lote têm leitura de até 60 min dentro da faixa da cultura."
            />
            <MetricCard
              accent="bg-[#ef4444]"
              label="Área sob risco"
              value={areas ? `${formatarNumero(areas.risco, 2)} ha` : '—'}
              icon={ShieldAlert}
              helper="Ao menos um sensor ativo do lote tem leitura de até 60 min fora da faixa da cultura."
            />
            <MetricCard
              accent="bg-[#94a3b8]"
              label="Área com dados insuficientes"
              value={
                areas ? `${formatarNumero(areas.semDados, 2)} ha` : '—'
              }
              icon={Leaf}
              helper="Sem cobertura suficiente de leituras válidas e recentes para classificar o lote."
            />
            <MetricCard
              accent="bg-[#168150]"
              label="Próxima colheita estimada"
              value={dataColheita ? formatarData(dataColheita) : '—'}
              icon={CalendarDays}
              helper="Estimativa cadastrada no lote; não é recomendação agronômica."
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Temperatura média (últimas 24h)"
              icon={Thermometer}
              accent="bg-[#e056fd]"
              value={
                !indicadoresAtuais
                  ? '—'
                  : !indicadoresAtuais.resumo
                    ? 'Indisponível'
                    : indicadoresAtuais.resumo.temperaturaMedia == null
                      ? 'Sem dados'
                      : `${formatarNumero(indicadoresAtuais.resumo.temperaturaMedia)} °C`
              }
            />
            <MetricCard
              label="Umidade média (últimas 24h)"
              icon={Droplets}
              accent="bg-[#00d2d3]"
              value={
                !indicadoresAtuais
                  ? '—'
                  : !indicadoresAtuais.resumo
                    ? 'Indisponível'
                    : indicadoresAtuais.resumo.umidadeMedia == null
                      ? 'Sem dados'
                      : `${formatarNumero(indicadoresAtuais.resumo.umidadeMedia)}%`
              }
            />
          </div>
        </section>

        <MonitoramentoProdutor
          carregando={!indicadoresAtuais}
          medias={indicadoresAtuais?.medias ?? null}
          areas={areas ?? null}
        />

        <section
          className="mt-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 p-1 shadow-xs"
          aria-label="Alertas monitorados"
        >
          <AlertasPainel
            estado={carregando ? { status: 'carregando' } : estadoAlertas}
          />
        </section>

        <section
          className={`${cartao} mt-4`}
          aria-labelledby="mercado-produtor"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="mercado-produtor"
              className="text-base font-semibold text-[#1d2b23]"
            >
              Mercado e cotações
            </h2>
            <Link
              className="text-sm font-semibold text-[#087a49] hover:underline"
              to="/mercado"
            >
              Ver mercado completo
            </Link>
          </div>
          <VariacaoMercado
            key={propriedadeFiltro}
            ufPropriedade={
              propriedadeFiltro ? propriedades[0]?.uf : undefined
            }
            revisao={recarregar}
          />
        </section>

        <section
          className={`${cartao} mt-4`}
          aria-labelledby="planejamento-produtor"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="planejamento-produtor"
              className="text-base font-semibold text-[#1d2b23]"
            >
              Planejamento e decisões
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <Link className={botaoAcaoPrimaria} to="/logistica">
                <Truck size={16} aria-hidden="true" /> Planejar transporte
              </Link>
              <Link className={botaoSecundario} to="/mercado">
                <TrendingUp size={16} aria-hidden="true" /> Ver cotações
              </Link>
            </div>
          </div>
          <JanelasProdutor
            key={propriedadeFiltro}
            lotes={lotes}
            sensores={sensores}
          />
        </section>

        <section
          className={`${cartao} mt-4`}
          aria-labelledby="propriedades-produtor"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="propriedades-produtor"
              className="text-base font-semibold text-[#1d2b23]"
            >
              Situação das propriedades
            </h2>
            <Link
              className="text-sm font-semibold text-[#087a49] hover:underline"
              to="/propriedades"
            >
              Ver todas
            </Link>
          </div>
          {propriedades.length === 0 ? (
            <EstadoVazio>
              Nenhuma propriedade disponível para esta seleção.
            </EstadoVazio>
          ) : (
            <ul className="divide-y divide-[#e6ece8]">
              {propriedades.slice(0, 6).map((p) => {
                const estado =
                  ESTADOS[
                    condicaoPropriedade(
                      p,
                      dados.lotes,
                      dados.sensores,
                      dados.leituras,
                      dados.alertas,
                    )
                  ]
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <Link
                        className="text-sm font-semibold text-[#2d3a33] hover:text-[#087a49] hover:underline"
                        to={`/propriedades/${p.id}`}
                      >
                        {p.nome}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#7a8780]">
                        {p.cidade} / {p.uf} · {p.totalLotes} lote(s)
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.classe}`}
                    >
                      {estado.nome}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-[#7a8780]">
            Situação baseada nas leituras e nos alertas consultados; ausência de
            alerta não comprova ausência de risco.
          </p>
        </section>

        <p className="mt-4 text-xs leading-5 text-[#75827a]">
          Dados de sensores representam últimas leituras recebidas, não
          monitoramento contínuo em tempo real. Alertas climáticos não são
          diagnósticos fitossanitários.
        </p>
      </main>
    </AppShell>
  )
}