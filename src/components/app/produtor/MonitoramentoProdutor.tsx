import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { cartao, EstadoVazio } from './ProdutorUi'
import { formatarNumero } from '@/lib/formatar'
import { distribuicaoAreas, serieHoraria } from '@/lib/monitoramentoProdutor'
import type { AreasProdutor, DashboardMedias } from '@/services/dashboardService'

const hora = (valor: number) =>
  new Date(valor).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Recife',
  })

const CORES_PASTEL_AREAS: Record<string, string> = {
  'Sob proteção': '#68B68E',
  'Sob risco': '#E58A8A',
  'Dados insuficientes': '#B8C4CE',
}

const SERIES_CLIMA = [
  {
    chave: 'temperatura',
    nome: 'Temperatura média',
    unidade: '°C',
    cor: '#D98A5F',
  },
  {
    chave: 'umidade',
    nome: 'Umidade média',
    unidade: '%',
    cor: '#5CA4C4',
  },
] as const

export function MonitoramentoProdutor({
  carregando,
  medias,
  areas,
}: {
  carregando: boolean
  medias: DashboardMedias | null
  areas: AreasProdutor | null
}) {
  const serie = serieHoraria(medias?.dados ?? [])
  const distribuicaoBruta = areas ? distribuicaoAreas(areas) : null
  const distribuicao = distribuicaoBruta
    ? distribuicaoBruta.map((item) => ({
        ...item,
        cor: CORES_PASTEL_AREAS[item.nome] ?? item.cor,
      }))
    : null
  const total = distribuicao?.reduce((soma, item) => soma + item.valor, 0) ?? 0

  return (
    <>
      <section className={`${cartao} mt-4`} aria-labelledby="monitoramento-produtor">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="monitoramento-produtor"
              className="text-base font-semibold text-[#1d2b23]"
            >
              Evolução horária (últimas 24h)
            </h2>
            <p className="mt-1 text-xs text-[#7a8780]">
              Médias dos sensores por hora · horário de Recife
            </p>
          </div>
          <TrendingUp size={18} className="text-[#168150]" aria-hidden="true" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {SERIES_CLIMA.map(({ chave, nome, unidade, cor }) => (
            <article
              key={chave}
              className="min-w-0 rounded-2xl border border-[#e6ece8] bg-[#fcfdfc] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cor }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-[#48574e]">
                  {nome} ({unidade})
                </h3>
              </div>

              {carregando ? (
                <EstadoVazio>Carregando leituras...</EstadoVazio>
              ) : !medias ? (
                <EstadoVazio>
                  Histórico temporariamente indisponível.
                </EstadoVazio>
              ) : !serie.some((item) => item[chave] !== null) ? (
                <EstadoVazio>Nenhuma leitura disponível no período.</EstadoVazio>
              ) : (
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={serie}
                      accessibilityLayer
                      margin={{ top: 10, right: 12, left: -6, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e8efe9"
                      />
                      <XAxis
                        dataKey="instante"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={hora}
                        tick={{ fill: '#6f7c74', fontSize: 11 }}
                        axisLine={{ stroke: '#e1e7e3' }}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        width={46}
                        tick={{ fill: '#6f7c74', fontSize: 11 }}
                        unit={unidade}
                        axisLine={false}
                        tickLine={false}
                        domain={
                          chave === 'umidade' ? [0, 100] : ['auto', 'auto']
                        }
                      />
                      <Tooltip
                        labelFormatter={(v) =>
                          new Date(Number(v)).toLocaleString('pt-BR', {
                            timeZone: 'America/Recife',
                          })
                        }
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #dce4df',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 10px 24px rgba(24, 37, 30, 0.08)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={chave}
                        name={nome}
                        unit={unidade}
                        stroke={cor}
                        strokeWidth={2.5}
                        dot={{
                          r: 3.5,
                          fill: '#ffffff',
                          stroke: cor,
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 5,
                          fill: cor,
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          ))}
        </div>

        <p className="mt-3 text-xs text-[#7a8780]">
          Os pontos representam médias disponíveis, não leituras contínuas em
          tempo real.
        </p>
      </section>

      <section
        className="mt-4 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm"
        aria-labelledby="areas-produtor-chart"
      >
        <div className="border-b border-[#edf2ee] px-5 py-5 sm:px-6">
          <h2
            id="areas-produtor-chart"
            className="text-base font-semibold tracking-[-0.01em] text-[#18251e]"
          >
            Distribuição das áreas produtivas
          </h2>
          <p className="mt-0.5 text-xs text-[#68756d]">
            Classificação dos lotes conforme os indicadores de proteção e risco.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {carregando ? (
            <EstadoVazio>Carregando áreas...</EstadoVazio>
          ) : !distribuicao ? (
            <EstadoVazio>Dados de áreas indisponíveis.</EstadoVazio>
          ) : total === 0 ? (
            <EstadoVazio>Nenhuma área contabilizada.</EstadoVazio>
          ) : (
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)]">
              <div className="relative mx-auto h-60 w-full max-w-[260px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer>
                    <Pie
                      data={distribuicao}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {distribuicao.map((item) => (
                        <Cell key={item.nome} fill={item.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${formatarNumero(Number(value), 2)} ha`,
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: '14px',
                        border: '1px solid #dce4df',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 24px rgba(24, 37, 30, 0.08)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-[#68756d]">
                    Área total
                  </span>
                  <span className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-[#18251e] tabular-nums">
                    {formatarNumero(total, 2)} ha
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e6ece8] bg-[#fcfdfc] p-4 sm:p-5">
                <div className="mb-4 flex items-baseline justify-between border-b border-[#edf2ee] pb-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#68756d]">
                    Composição por condição
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[#18251e]">
                    {formatarNumero(total, 2)} ha no total
                  </span>
                </div>

                <ul className="space-y-4">
                  {distribuicao.map((item) => {
                    const percentual = (item.valor / total) * 100
                    return (
                      <li key={item.nome}>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="inline-flex items-center gap-2 font-medium text-[#34443b]">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: item.cor }}
                              aria-hidden="true"
                            />
                            {item.nome}
                          </span>
                          <span className="tabular-nums text-[#5c6b63]">
                            <strong className="font-semibold text-[#18251e]">
                              {formatarNumero(item.valor, 2)} ha
                            </strong>{' '}
                            <span className="text-xs text-[#68756d]">
                              ({formatarNumero(percentual, 1)}%)
                            </span>
                          </span>
                        </div>

                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#edf2ee]">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(0, percentual))}%`,
                              backgroundColor: item.cor,
                            }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}