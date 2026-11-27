import {
  AlertTriangle,
  Clock3,
  Cpu,
  Droplets,
  RotateCcw,
  Sprout,
  Thermometer,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarData } from '@/lib/formatar'
import { alertaService } from '@/services/alertaService'
import { ApiError } from '@/services/api'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import type { Alerta, Lote, PropriedadeResumo } from '@/types/api'

const INFO_ALERTA: Record<
  Alerta['tipo'],
  {
    titulo: string
    variavel: 'Temperatura' | 'Umidade'
    direcao: 'Acima do limite' | 'Abaixo do limite'
    faixaClass: string
    badgeClass: string
  }
> = {
  TEMPERATURA_ALTA: {
    titulo: 'Temperatura acima do limite recomendado',
    variavel: 'Temperatura',
    direcao: 'Acima do limite',
    faixaClass: 'border-l-[#E5A72C]',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  TEMPERATURA_BAIXA: {
    titulo: 'Temperatura abaixo do limite recomendado',
    variavel: 'Temperatura',
    direcao: 'Abaixo do limite',
    faixaClass: 'border-l-[#39BCE5]',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
  },
  UMIDADE_ALTA: {
    titulo: 'Umidade relativa acima do limite recomendado',
    variavel: 'Umidade',
    direcao: 'Acima do limite',
    faixaClass: 'border-l-[#39BCE5]',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
  },
  UMIDADE_BAIXA: {
    titulo: 'Umidade relativa abaixo do limite recomendado',
    variavel: 'Umidade',
    direcao: 'Abaixo do limite',
    faixaClass: 'border-l-[#E5A72C]',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
}

export default function Diagnostico() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])

  const [propriedadeSelecionada, setPropriedadeSelecionada] = useState('')
  const [loteSelecionado, setLoteSelecionado] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosAlertas, dadosPropriedades, dadosLotes] =
          await Promise.all([
            alertaService.listar(),
            propriedadeService.listar(),
            loteService.listar(),
          ])

        if (!ativo) return

        setAlertas(dadosAlertas.alertas)
        setPropriedades(dadosPropriedades)
        setLotes(dadosLotes)
      } catch (error) {
        if (!ativo) return
        setErro(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os dados do diagnóstico.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarDados()

    return () => {
      ativo = false
    }
  }, [])

  const alertasFiltrados = alertas.filter((alerta) => {
    const correspondePropriedade =
      !propriedadeSelecionada ||
      String(alerta.propriedadeId) === propriedadeSelecionada

    const correspondeLote =
      !loteSelecionado || String(alerta.loteId) === loteSelecionado

    return correspondePropriedade && correspondeLote
  })

  const propriedadesNoEscopo = propriedadeSelecionada
    ? propriedades.filter(
        (propriedade) => String(propriedade.id) === propriedadeSelecionada,
      )
    : propriedades

  const lotesDisponiveis = lotes.filter(
    (lote) =>
      !propriedadeSelecionada ||
      String(lote.propriedadeId) === propriedadeSelecionada,
  )

  const totalSensores = propriedadesNoEscopo.reduce(
    (total, propriedade) => total + propriedade.totalSensores,
    0,
  )
  const totalPropriedades = propriedadesNoEscopo.length
  const totalAlertas = alertasFiltrados.length
  const leiturasDesatualizadas = alertasFiltrados.filter(
    (alerta) => alerta.leituraDesatualizada,
  ).length

  const temFiltroAtivo = Boolean(propriedadeSelecionada || loteSelecionado)

  function limparFiltros() {
    setPropriedadeSelecionada('')
    setLoteSelecionado('')
  }

  return (
    <AppShell section="overview">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Central de diagnóstico
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Acompanhe os alertas climáticos e a condição das leituras nos
              lotes assistidos.
            </p>
          </div>
        </section>

        {/* Indicadores */}
        <section
          aria-label="Resumo do diagnóstico"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#68756d]">
                Propriedades monitoradas
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                <Sprout size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] tabular-nums text-[#18251e]">
              {totalPropriedades}
            </p>
            <p className="mt-1 text-xs text-[#7a8980]">
              {propriedadeSelecionada
                ? 'Unidade selecionada no filtro'
                : 'Unidades produtivas disponíveis'}
            </p>
          </article>

          <article className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#68756d]">
                Sensores cadastrados
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                <Cpu size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] tabular-nums text-[#18251e]">
              {totalSensores}
            </p>
            <p className="mt-1 text-xs text-[#7a8980]">
              {propriedadeSelecionada
                ? 'Dispositivos na propriedade'
                : 'Dispositivos nas propriedades'}
            </p>
          </article>

          <article className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#68756d]">
                Alertas identificados
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  totalAlertas > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-[#f2f5f3] text-[#68756d]'
                }`}
              >
                <AlertTriangle size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] tabular-nums text-[#18251e]">
              {totalAlertas}
            </p>
            <p className="mt-1 text-xs text-[#7a8980]">
              {temFiltroAtivo
                ? 'Ocorrências no recorte filtrado'
                : 'Total de alertas registrados'}
            </p>
          </article>

          <article className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#68756d]">
                Leituras desatualizadas
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  leiturasDesatualizadas > 0
                    ? 'bg-red-50 text-red-600'
                    : 'bg-[#f2f5f3] text-[#68756d]'
                }`}
              >
                <Clock3 size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-[2rem] font-semibold tracking-[-0.03em] tabular-nums text-[#18251e]">
              {leiturasDesatualizadas}
            </p>
            <p className="mt-1 text-xs text-[#7a8980]">
              Alertas com telemetria antiga
            </p>
          </article>
        </section>

        {/* Card separado de filtros */}
        <section
          aria-label="Filtros de alertas"
          className="mt-6 rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="filtro-propriedade"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#5c6b63]"
              >
                Propriedade
              </label>

              <select
                id="filtro-propriedade"
                value={propriedadeSelecionada}
                onChange={(e) => {
                  setPropriedadeSelecionada(e.target.value)
                  setLoteSelecionado('')
                }}
                disabled={carregando}
                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-3.5 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Todas as propriedades</option>
                {propriedades.map((propriedade) => (
                  <option key={propriedade.id} value={propriedade.id}>
                    {propriedade.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-lote"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#5c6b63]"
              >
                Lote
              </label>

              <select
                id="filtro-lote"
                value={loteSelecionado}
                onChange={(e) => setLoteSelecionado(e.target.value)}
                disabled={carregando}
                className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-3.5 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Todos os lotes</option>
                {lotesDisponiveis.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.identificacao}
                  </option>
                ))}
              </select>
            </div>

            {temFiltroAtivo ? (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 text-sm font-semibold text-[#48574e] transition hover:bg-[#f2f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </section>

        {/* Card de lista de alertas */}
        <section
          aria-labelledby="titulo-alertas-diagnostico"
          className="mt-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ee] px-5 py-5 sm:px-7">
            <div>
              <h2
                id="titulo-alertas-diagnostico"
                className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]"
              >
                Alertas climáticos e operacionais
              </h2>
              <p className="mt-0.5 text-sm text-[#68756d]">
                Desvios de temperatura e umidade identificados nas leituras dos
                sensores.
              </p>
            </div>

            {!carregando && !erro ? (
              <span className="rounded-full border border-[#dce6e0] bg-[#f6f9f7] px-3 py-1 text-xs font-semibold tabular-nums text-[#33443a]">
                {alertasFiltrados.length}{' '}
                {alertasFiltrados.length === 1
                  ? 'alerta encontrado'
                  : 'alertas encontrados'}
              </span>
            ) : null}
          </div>

          <div className="p-5 sm:p-7">
            {carregando ? (
              <div
                className="grid min-h-[240px] place-items-center"
                role="status"
                aria-live="polite"
              >
                <div className="text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
                  <p className="mt-3.5 text-sm text-[#68756d]">
                    Carregando dados do diagnóstico...
                  </p>
                </div>
              </div>
            ) : erro ? (
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            ) : alertasFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-[#dcebe2] bg-[#f6fbf8] px-5 py-10 text-center">
                <img
                  src="/assets/Checklist-cuate.svg"
                  alt=""
                  aria-hidden="true"
                  className="mx-auto mb-3 h-32 w-44 select-none object-contain"
                />

                <p className="text-base font-semibold text-[#18251e]">
                  Nenhum alerta encontrado
                </p>

                <p className="mx-auto mt-1 max-w-md text-sm text-[#5c6b63]">
                  {temFiltroAtivo
                    ? 'Não há ocorrências registradas para a propriedade ou lote selecionados.'
                    : 'Todas as leituras monitoradas estão dentro dos limites ideais das culturas.'}
                </p>

                {temFiltroAtivo ? (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#cce0d4] bg-white px-4 text-xs font-semibold text-[#15693E] transition hover:bg-[#edf7f1]"
                  >
                    Ver todos os registros
                  </button>
                ) : null}
              </div>
            ) : (
              <div>
                {/* Faixa ilustrativa quando há alertas ativos */}
                <div className="mb-5 flex flex-col items-center gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 text-center sm:flex-row sm:px-5 sm:text-left">
                  <img
                    src="/assets/Warning-rafiki.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-28 shrink-0 select-none object-contain"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#18251e]">
                      Atenção aos parâmetros fora da faixa ideal
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#5c6b63]">
                      Inspecione os dispositivos listados abaixo e avalie
                      ajustes de manejo ou irrigação nos lotes afetados.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {alertasFiltrados.map((alerta, index) => {
                    const info = INFO_ALERTA[alerta.tipo]
                    const propriedadeNome = propriedades.find(
                      (p) => p.id === alerta.propriedadeId,
                    )?.nome
                    const IconeVariavel =
                      info.variavel === 'Temperatura' ? Thermometer : Droplets

                    return (
                      <article
                        key={`${alerta.sensorId}-${alerta.dataHoraLeitura}-${index}`}
                        className={`overflow-hidden rounded-2xl border border-[#e1e7e3] border-l-[5px] ${info.faixaClass} bg-white p-4 shadow-xs transition hover:border-[#cfd9d3] sm:p-5`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.badgeClass}`}
                              >
                                <IconeVariavel size={13} aria-hidden="true" />
                                {info.variavel} · {info.direcao}
                              </span>

                              {alerta.leituraDesatualizada ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                  <Clock3 size={12} aria-hidden="true" />
                                  Leitura desatualizada
                                </span>
                              ) : null}
                            </div>

                            <h3 className="mt-2.5 text-base font-semibold text-[#18251e]">
                              {info.titulo}
                            </h3>

                            <p className="mt-1 text-sm text-[#5c6b63]">
                              {propriedadeNome ? `${propriedadeNome} · ` : ''}
                              Lote{' '}
                              <span className="font-medium text-[#28372f]">
                                {alerta.loteIdentificacao}
                              </span>{' '}
                              · Cultura{' '}
                              <span className="font-medium text-[#28372f]">
                                {alerta.culturaNome}
                              </span>
                            </p>
                          </div>

                          <span className="w-fit shrink-0 rounded-lg border border-[#e1e7e3] bg-[#f8faf9] px-2.5 py-1 font-mono text-xs font-semibold text-[#33443a]">
                            {alerta.sensorCodigo}
                          </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-[#e6ede9] bg-[#f8faf9] p-3.5 sm:grid-cols-3">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#76847c]">
                              Valor identificado
                            </dt>
                            <dd className="mt-1 text-sm font-semibold tabular-nums text-[#18251e]">
                              {formatarMedidaAlerta(alerta.valor, alerta.tipo)}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#76847c]">
                              Limite configurado
                            </dt>
                            <dd className="mt-1 text-sm font-semibold tabular-nums text-[#18251e]">
                              {formatarMedidaAlerta(alerta.limite, alerta.tipo)}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#76847c]">
                              Data da leitura
                            </dt>
                            <dd className="mt-1 text-sm font-semibold tabular-nums text-[#18251e]">
                              {formatarData(alerta.dataHoraLeitura)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <p className="mt-4 text-xs leading-5 text-[#75827a]">
          Os alertas refletem as últimas telemetrias recebidas frente aos
          parâmetros climáticos cadastrados para cada cultura e não substituem
          vistoria técnica em campo.
        </p>
      </div>
    </AppShell>
  )
}

function formatarMedidaAlerta(
  valor: number | string,
  tipo: Alerta['tipo'],
): string {
  const unidade = tipo.startsWith('TEMPERATURA') ? ' °C' : '%'
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)}${unidade}`
  }
  const texto = String(valor ?? '').trim()
  if (!texto) return '—'
  if (texto.includes('°C') || texto.includes('%')) return texto
  const numero = Number(texto.replace(',', '.'))
  if (Number.isFinite(numero)) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numero)}${unidade}`
  }
  return texto
}