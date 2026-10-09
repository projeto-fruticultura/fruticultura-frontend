import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Cpu,
  LayoutDashboard,
  Layers3,
  MapPinned,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'
import { AlertasPainel, type EstadoAlertas } from '@/components/app/dashboard/AlertasPainel'
import { LeiturasTabela, type LinhaLeitura } from '@/components/app/dashboard/LeiturasTabela'
import { PrecosMercado } from '@/components/app/dashboard/PrecosMercado'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { alertaService } from '@/services/alertaService'
import { leituraService } from '@/services/leituraService'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import { sensorService } from '@/services/sensorService'
import type { Leitura, Lote, Paginacao, PropriedadeResumo, Sensor } from '@/types/api'

type DashboardTab = 'overview' | 'production'

interface Catalogo {
  propriedades: PropriedadeResumo[]
  lotes: Lote[]
  sensores: Sensor[]
}

interface FiltrosAplicados {
  propriedadeId?: number
  loteId?: number
  sensorId?: number
}

interface EstadoLeituras {
  carregando: boolean
  erro: string
  linhas: LinhaLeitura[]
  paginacao?: Paginacao
}

const UMA_HORA_MS = 60 * 60 * 1000
const LEITURAS_POR_PAGINA = 15

// Os nomes de propriedade, lote e sensor vem do catalogo: a leitura so traz o sensorId.
function montarLinhas(leituras: Leitura[], catalogo: Catalogo, agora: number): LinhaLeitura[] {
  return leituras.map((leitura) => {
    const sensor = catalogo.sensores.find((item) => item.id === leitura.sensorId)
    const lote = sensor ? catalogo.lotes.find((item) => item.id === sensor.loteId) : undefined
    const propriedade = lote ? catalogo.propriedades.find((item) => item.id === lote.propriedadeId) : undefined

    return {
      id: leitura.id,
      propriedade: propriedade?.nome ?? '—',
      lote: sensor?.lote.identificacao ?? '—',
      sensor: sensor?.codigo ?? `Sensor #${leitura.sensorId}`,
      temperatura: leitura.temperatura,
      umidade: leitura.umidade,
      dataHoraLeitura: leitura.dataHoraLeitura,
      desatualizada: agora - Date.parse(leitura.dataHoraLeitura) > UMA_HORA_MS,
    }
  })
}

// 404 = o backend nao tem a rota de alertas: a tela mostra "indisponiveis" e segue funcionando.
async function buscarAlertas(filtros: FiltrosAplicados = {}): Promise<EstadoAlertas> {
  try {
    const resposta = await alertaService.listar({ propriedadeId: filtros.propriedadeId, loteId: filtros.loteId })
    // O filtro por sensor so existe no front: a rota filtra por propriedade e por lote.
    const alertas = filtros.sensorId
      ? resposta.alertas.filter((alerta) => alerta.sensorId === filtros.sensorId)
      : resposta.alertas
    return { status: 'ok', total: filtros.sensorId ? alertas.length : resposta.total, alertas }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: 'indisponivel' }
    return {
      status: 'erro',
      mensagem: error instanceof ApiError ? error.message : 'Não foi possível carregar os alertas.',
    }
  }
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [alertasGerais, setAlertasGerais] = useState<EstadoAlertas>({ status: 'carregando' })
  const [recentes, setRecentes] = useState<EstadoLeituras>({ carregando: true, erro: '', linhas: [] })

  const [propriedadeFiltro, setPropriedadeFiltro] = useState('')
  const [loteFiltro, setLoteFiltro] = useState('')
  const [sensorFiltro, setSensorFiltro] = useState('')
  const [producaoIniciada, setProducaoIniciada] = useState(false)
  const [aplicados, setAplicados] = useState<FiltrosAplicados>({})
  const [producao, setProducao] = useState<EstadoLeituras>({ carregando: false, erro: '', linhas: [] })
  const [alertasProducao, setAlertasProducao] = useState<EstadoAlertas>({ status: 'carregando' })

  // Catalogo mais recente, lido tambem por funcoes assincronas que rodam depois de a tela mudar.
  const catalogo = useRef<Catalogo>({ propriedades: [], lotes: [], sensores: [] })

  async function carregarRecentes() {
    setRecentes((atual) => ({ ...atual, carregando: true, erro: '' }))

    try {
      const resposta = await leituraService.listar({ limite: 10 })
      setRecentes({ carregando: false, erro: '', linhas: montarLinhas(resposta.dados, catalogo.current, Date.now()) })
    } catch (error) {
      setRecentes({
        carregando: false,
        erro: error instanceof ApiError ? error.message : 'Não foi possível carregar as leituras.',
        linhas: [],
      })
    }
  }

  async function carregarDashboard() {
    setCarregando(true)
    setErro('')
    setAlertasGerais({ status: 'carregando' })

    // Os alertas nao dependem do restante: buscam em paralelo (e nunca rejeitam).
    const pedidoAlertas = buscarAlertas()

    try {
      const [listaPropriedades, listaLotes, listaSensores] = await Promise.all([
        propriedadeService.listar(),
        loteService.listar(),
        sensorService.listar(),
      ])
      catalogo.current = { propriedades: listaPropriedades, lotes: listaLotes, sensores: listaSensores }
      setPropriedades(listaPropriedades)
      setLotes(listaLotes)
      setSensores(listaSensores)
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados do dashboard.')
    } finally {
      setCarregando(false)
    }

    setAlertasGerais(await pedidoAlertas)
    await carregarRecentes()
  }

  useEffect(() => {
    void carregarDashboard()
  }, [])

  async function carregarProducao(filtros: FiltrosAplicados, pagina: number) {
    setProducao((atual) => ({ ...atual, carregando: true, erro: '' }))
    setAlertasProducao({ status: 'carregando' })

    const pedidoAlertas = buscarAlertas(filtros)

    try {
      const resposta = await leituraService.listar({ ...filtros, pagina, limite: LEITURAS_POR_PAGINA })
      setProducao({
        carregando: false,
        erro: '',
        linhas: montarLinhas(resposta.dados, catalogo.current, Date.now()),
        paginacao: resposta.paginacao,
      })
    } catch (error) {
      setProducao({
        carregando: false,
        erro: error instanceof ApiError ? error.message : 'Não foi possível carregar as leituras.',
        linhas: [],
      })
    }

    setAlertasProducao(await pedidoAlertas)
  }

  function abrirAba(aba: DashboardTab) {
    setActiveTab(aba)
    if (aba === 'production' && !producaoIniciada) {
      setProducaoIniciada(true)
      void carregarProducao(aplicados, 1)
    }
  }

  function aplicarFiltros() {
    const filtros: FiltrosAplicados = {
      propriedadeId: propriedadeFiltro ? Number(propriedadeFiltro) : undefined,
      loteId: loteFiltro ? Number(loteFiltro) : undefined,
      sensorId: sensorFiltro ? Number(sensorFiltro) : undefined,
    }
    setAplicados(filtros)
    void carregarProducao(filtros, 1)
  }

  function mudarPropriedade(valor: string) {
    setPropriedadeFiltro(valor)
    setLoteFiltro('')
    setSensorFiltro('')
  }

  function mudarLote(valor: string) {
    setLoteFiltro(valor)
    setSensorFiltro('')
  }

  // Os seletores se afunilam: lotes da propriedade escolhida e sensores do lote (ou da propriedade) escolhido.
  const lotesDoFiltro = useMemo(
    () => (propriedadeFiltro ? lotes.filter((lote) => String(lote.propriedadeId) === propriedadeFiltro) : lotes),
    [lotes, propriedadeFiltro],
  )
  const sensoresDoFiltro = useMemo(() => {
    if (loteFiltro) return sensores.filter((sensor) => String(sensor.loteId) === loteFiltro)
    if (propriedadeFiltro) {
      const idsDosLotes = new Set(lotesDoFiltro.map((lote) => lote.id))
      return sensores.filter((sensor) => idsDosLotes.has(sensor.loteId))
    }
    return sensores
  }, [sensores, loteFiltro, propriedadeFiltro, lotesDoFiltro])

  const totals = useMemo(
    () => ({
      propriedades: propriedades.length,
      lotes: propriedades.reduce((total, propriedade) => total + propriedade.totalLotes, 0),
      sensores: propriedades.reduce((total, propriedade) => total + propriedade.totalSensores, 0),
    }),
    [propriedades],
  )

  const alertasValor =
    alertasGerais.status === 'ok' ? alertasGerais.total : '—'
  const alertasAjuda =
    alertasGerais.status === 'indisponivel'
      ? 'Alertas indisponíveis'
      : alertasGerais.status === 'erro'
        ? 'Não foi possível carregar os alertas'
        : undefined

  const firstName = usuario?.nome?.trim().split(/\s+/)[0] || 'Produtor'

  return (
    <AppShell section="overview">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex w-full max-w-max rounded-xl border border-[#dbe5df] bg-[#e9f8ef] p-1"
            role="tablist"
            aria-label="Seções do dashboard"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => abrirAba('overview')}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] ${
                activeTab === 'overview'
                  ? 'bg-[#a9edc4] text-[#075c36] shadow-sm'
                  : 'text-[#496058] hover:bg-white/60'
              }`}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Visão Geral
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'production'}
              onClick={() => abrirAba('production')}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] ${
                activeTab === 'production'
                  ? 'bg-[#a9edc4] text-[#075c36] shadow-sm'
                  : 'text-[#496058] hover:bg-white/60'
              }`}
            >
              <Activity size={16} aria-hidden="true" />
              Acompanhamento da produção
            </button>
          </div>

          <button
            type="button"
            onClick={() => void carregarDashboard()}
            disabled={carregando}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#dbe5df] bg-white px-4 text-sm font-semibold text-[#405249] transition hover:bg-[#f3f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} aria-hidden="true" />
            Atualizar
          </button>
        </div>

        {erro ? (
          <div className="mt-4">
            <FeedbackMessage variant="error">{erro}</FeedbackMessage>
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <section className="mt-5" role="tabpanel" aria-label="Visão geral">
            <div className="rounded-[22px] border border-[#e0e7e2] bg-white px-5 py-5 shadow-sm sm:px-6 lg:px-7">
              <h1 className="text-[clamp(1.55rem,2.6vw,2rem)] font-semibold tracking-[-0.035em] text-[#18251e]">
                Olá, {firstName}
              </h1>
              <p className="mt-1 text-sm text-[#6f7c74]">Acompanhe a situação da sua produção.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Propriedades"
                  value={carregando ? '—' : totals.propriedades}
                  icon={MapPinned}
                  accent="bg-[#28d887]"
                />
                <MetricCard
                  label="Lotes"
                  value={carregando ? '—' : totals.lotes}
                  icon={Layers3}
                  accent="bg-[#4aa7e8]"
                />
                <MetricCard
                  label="Sensores"
                  value={carregando ? '—' : totals.sensores}
                  icon={Cpu}
                  accent="bg-[#9858dd]"
                />
                <MetricCard
                  label="Alertas ativos"
                  value={alertasValor}
                  icon={AlertTriangle}
                  accent="bg-[#f2a23d]"
                  helper={alertasAjuda}
                />
              </div>
            </div>

            <div className="mt-4">
              <AlertasPainel estado={alertasGerais} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.42fr)]">
              <section className="rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="properties-dashboard-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="properties-dashboard-title" className="text-base font-semibold text-[#1d2b23]">Minhas propriedades</h2>
                    <p className="mt-1 text-xs text-[#7a8780]">Propriedades vinculadas à sua conta</p>
                  </div>
                  <MapPinned size={18} className="text-[#168150]" aria-hidden="true" />
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-[#e6ece8]">
                  {carregando ? (
                    <div className="grid min-h-36 place-items-center p-5 text-sm text-[#6f7c74]">Carregando propriedades...</div>
                  ) : propriedades.length ? (
                    <ol className="divide-y divide-[#edf1ee]">
                      {propriedades.slice(0, 5).map((propriedade, index) => (
                        <li key={propriedade.id} className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 px-3 py-3 text-sm">
                          <span className="text-xs font-semibold text-[#8a958f]">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#2d3a33]">{propriedade.nome}</p>
                            <p className="mt-0.5 truncate text-xs text-[#7a8780]">{propriedade.cidade} - {propriedade.uf}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="grid min-h-36 place-items-center p-5 text-center text-sm text-[#6f7c74]">
                      Nenhuma propriedade cadastrada.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="latest-readings-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="latest-readings-title" className="text-base font-semibold text-[#1d2b23]">Últimas leituras</h2>
                    <p className="mt-1 text-xs text-[#7a8780]">Dados recentes dos sensores da produção</p>
                  </div>
                  <Activity size={18} className="text-[#168150]" aria-hidden="true" />
                </div>

                <div className="mt-4">
                  <LeiturasTabela
                    linhas={recentes.linhas}
                    carregando={recentes.carregando}
                    erro={recentes.erro}
                    vazio="Nenhuma leitura recebida ainda para os seus sensores."
                  />
                </div>
              </section>
            </div>
          </section>
        ) : (
          <section className="mt-5" role="tabpanel" aria-label="Acompanhamento da produção">
            <div className="rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
              <h1 className="text-[clamp(1.55rem,2.6vw,2rem)] font-semibold tracking-[-0.035em] text-[#18251e]">
                Acompanhamento da produção
              </h1>
              <p className="mt-1 text-sm text-[#6f7c74]">Monitore as condições dos seus lotes e acompanhe suas leituras.</p>
            </div>

            <section className="mt-4 rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="dashboard-filters-title">
              <div className="flex items-center gap-2 text-[#26372e]">
                <SlidersHorizontal size={17} aria-hidden="true" />
                <h2 id="dashboard-filters-title" className="text-sm font-semibold">Filtrar por:</h2>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] lg:items-end">
                <FilterSelect
                  id="dashboard-propriedade"
                  label="Propriedade"
                  value={propriedadeFiltro}
                  onChange={mudarPropriedade}
                  disabled={carregando}
                >
                  <option value="">Todas as propriedades</option>
                  {propriedades.map((propriedade) => (
                    <option key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</option>
                  ))}
                </FilterSelect>

                <FilterSelect id="dashboard-lote" label="Lote" value={loteFiltro} onChange={mudarLote} disabled={carregando}>
                  <option value="">Todos os lotes</option>
                  {lotesDoFiltro.map((lote) => (
                    <option key={lote.id} value={String(lote.id)}>{lote.identificacao}</option>
                  ))}
                </FilterSelect>

                <FilterSelect id="dashboard-sensor" label="Sensor" value={sensorFiltro} onChange={setSensorFiltro} disabled={carregando}>
                  <option value="">Todos os sensores</option>
                  {sensoresDoFiltro.map((sensor) => (
                    <option key={sensor.id} value={String(sensor.id)}>{sensor.codigo}</option>
                  ))}
                </FilterSelect>

                <button
                  type="button"
                  onClick={aplicarFiltros}
                  disabled={producao.carregando}
                  className="min-h-11 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Aplicar filtros
                </button>
              </div>

              <div className="mt-6">
                <LeiturasTabela
                  linhas={producao.linhas}
                  carregando={producao.carregando}
                  erro={producao.erro}
                  vazio="Nenhuma leitura encontrada para estes filtros."
                  paginacao={producao.paginacao}
                  onPagina={(pagina) => void carregarProducao(aplicados, pagina)}
                />
              </div>
            </section>

            <div className="mt-4">
              <AlertasPainel estado={alertasProducao} />
            </div>

            <PrecosMercado />
          </section>
        )}
      </main>
    </AppShell>
  )
}

interface MetricCardProps {
  label: string
  value: number | string
  icon: typeof MapPinned
  accent: string
  helper?: string
}

function MetricCard({ label, value, icon: Icon, accent, helper }: MetricCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#e7ece9] bg-[#fbfcfb] px-4 py-4 shadow-[0_2px_8px_rgba(28,50,37,0.04)]">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div>
          <p className="text-xs font-semibold text-[#5f6d65]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1b2821]">{value}</p>
          {helper ? <p className="mt-1 text-[10px] leading-4 text-[#8a958f]">{helper}</p> : null}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5c6c63] shadow-sm">
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

interface FilterSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  children: ReactNode
}

function FilterSelect({ id, label, value, onChange, disabled = false, children }: FilterSelectProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#526158]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-11 w-full rounded-xl border border-[#dce4df] bg-[#f6f8f7] px-3 text-sm text-[#35453c] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  )
}
