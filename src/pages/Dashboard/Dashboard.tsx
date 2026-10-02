import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeResumo } from '@/types/api'

type DashboardTab = 'overview' | 'production'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [propriedadeFiltro, setPropriedadeFiltro] = useState('')
  const [loteFiltro, setLoteFiltro] = useState('')
  const [sensorFiltro, setSensorFiltro] = useState('')

  async function carregarDashboard() {
    setCarregando(true)
    setErro('')

    try {
      setPropriedades(await propriedadeService.listar())
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados do dashboard.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDashboard()
  }, [])

  const totals = useMemo(
    () => ({
      propriedades: propriedades.length,
      lotes: propriedades.reduce((total, propriedade) => total + propriedade.totalLotes, 0),
      sensores: propriedades.reduce((total, propriedade) => total + propriedade.totalSensores, 0),
      alertas: 0,
    }),
    [propriedades],
  )

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
              onClick={() => setActiveTab('overview')}
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
              onClick={() => setActiveTab('production')}
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
                  value={totals.alertas}
                  icon={AlertTriangle}
                  accent="bg-[#f2a23d]"
                  helper="Integração de alertas ainda não disponível"
                />
              </div>
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

                <div className="mt-4 overflow-x-auto rounded-xl border border-[#e6ece8]">
                  <table className="w-full min-w-[650px] border-collapse text-left text-xs">
                    <thead className="bg-[#eef1ef] text-[#435249]">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Propriedade</th>
                        <th className="px-3 py-2.5 font-semibold">Lote</th>
                        <th className="px-3 py-2.5 font-semibold">Sensor</th>
                        <th className="px-3 py-2.5 font-semibold">Temperatura</th>
                        <th className="px-3 py-2.5 font-semibold">Umidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="h-36 px-4 py-8 text-center text-sm text-[#7a8780]">
                          As leituras aparecerão aqui quando a integração de sensores estiver disponível.
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
                  onChange={setPropriedadeFiltro}
                  disabled={carregando}
                >
                  <option value="">Todas as propriedades</option>
                  {propriedades.map((propriedade) => (
                    <option key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</option>
                  ))}
                </FilterSelect>

                <FilterSelect id="dashboard-lote" label="Lote" value={loteFiltro} onChange={setLoteFiltro} disabled>
                  <option value="">Todos os lotes</option>
                </FilterSelect>

                <FilterSelect id="dashboard-sensor" label="Sensor" value={sensorFiltro} onChange={setSensorFiltro} disabled>
                  <option value="">Todos os sensores</option>
                </FilterSelect>

                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
                >
                  Aplicar filtros
                </button>
              </div>

              <div className="mt-6 grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-[#d8e1db] bg-[#fbfdfb] px-5 text-center">
                <div className="max-w-md">
                  <Activity size={26} className="mx-auto text-[#009B4D]" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-[#2b3a31]">Acompanhamento preparado para integração</h3>
                  <p className="mt-2 text-sm leading-6 text-[#75827a]">
                    Lotes, sensores e leituras serão exibidos aqui quando esses dados estiverem disponíveis pela API.
                  </p>
                </div>
              </div>
            </section>
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
