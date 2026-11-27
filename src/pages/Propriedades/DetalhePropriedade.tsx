import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { PropertyLocationPreview } from '@/components/propriedades/PropertyLocationPreview'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeDetalhe } from '@/types/api'

export default function DetalhePropriedade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const somenteLeitura = usuario?.perfil === 'TECNICO'
  const propertyId = Number(id)

  const [item, setItem] = useState<PropriedadeDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      setError('Identificador de propriedade inválido.')
      setLoading(false)
      return
    }

    let ativo = true

    propriedadeService
      .buscarPorId(propertyId)
      .then((dados) => {
        if (ativo) setItem(dados)
      })
      .catch((requestError) => {
        if (!ativo) return
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Não foi possível carregar a propriedade.',
        )
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })

    return () => {
      ativo = false
    }
  }, [propertyId])

  async function confirmarRemocao() {
    if (!item) return

    setConfirmOpen(false)
    setDeleting(true)
    setError('')

    try {
      await propriedadeService.remover(item.id)
      navigate('/propriedades', { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Não foi possível remover a propriedade.',
      )
      setDeleting(false)
    }
  }

  const latNumero = Number(item?.latitude)
  const lngNumero = Number(item?.longitude)
  const coordenadasValidas =
    item !== null &&
    item.latitude !== null &&
    item.latitude !== undefined &&
    item.longitude !== null &&
    item.longitude !== undefined &&
    Number.isFinite(latNumero) &&
    Number.isFinite(lngNumero) &&
    !(latNumero === 0 && lngNumero === 0)

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Propriedades', to: '/propriedades' },
            { label: item?.nome ?? 'Detalhes' },
          ]}
        />

        {loading ? (
          <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
            <div className="text-center" role="status" aria-live="polite">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
              <p className="mt-4 text-sm text-[#6d7a72]">
                Carregando propriedade...
              </p>
            </div>
          </div>
        ) : error && !item ? (
          <FeedbackMessage variant="error">{error}</FeedbackMessage>
        ) : item ? (
          <>
            {/* Cabeçalho padronizado */}
            <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                      {item.nome}
                    </h1>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusStyle(item.status)}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#68756d]">
                    {item.cidade} - {item.uf} · Unidade #{item.id}
                  </p>
                </div>

                {!somenteLeitura && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/propriedades/${item.id}/editar`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D9A31A] bg-white px-5 text-sm font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A31A]/40"
                    >
                      Editar propriedade
                    </Link>

                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      disabled={deleting}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {deleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {error ? (
              <div className="mt-5">
                <FeedbackMessage variant="error">{error}</FeedbackMessage>
              </div>
            ) : null}

            {/* Grade principal em duas colunas */}
            <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(440px,1.12fr)]">
              {/* Coluna esquerda: indicadores e metadados estruturados */}
              <div className="space-y-6">
                <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
                  <div className="border-b border-[#edf2ee] pb-5">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                      Resumo da unidade produtiva
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#68756d]">
                      Dimensão territorial, estrutura operacional e referência
                      geográfica cadastrada.
                    </p>
                  </div>

                  {/* Grupo 1: Indicadores principais */}
                  <div className="mt-5 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                      Capacidade e monitoramento
                    </p>

                    <dl className="grid gap-3.5 sm:grid-cols-3">
                      <MetricCard
                        label="Área total"
                        value={`${formatArea(item.area)} ha`}
                      />
                      <MetricCard
                        label="Lotes"
                        value={String(item.totalLotes)}
                      />
                      <MetricCard
                        label="Sensores"
                        value={String(item.totalSensores)}
                      />
                    </dl>
                  </div>

                  {/* Grupo 2: Georreferenciamento */}
                  <div className="mt-6 space-y-3 border-t border-[#edf2ee] pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                        Georreferenciamento
                      </p>

                      {item.coordenadasEstimadasUf === true ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          Referência estimada por UF
                        </span>
                      ) : coordenadasValidas ? (
                        <span className="rounded-full bg-[#edf7f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#15693E]">
                          Coordenadas vinculadas
                        </span>
                      ) : null}
                    </div>

                    <dl className="grid gap-3.5 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] px-4 py-3.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#76847c]">
                          Latitude
                        </dt>
                        <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#18251e]">
                          {coordenadasValidas ? latNumero.toFixed(6) : '—'}
                        </dd>
                      </div>

                      <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] px-4 py-3.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#76847c]">
                          Longitude
                        </dt>
                        <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#18251e]">
                          {coordenadasValidas ? lngNumero.toFixed(6) : '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Grupo 3: Histórico do registro */}
                  <div className="mt-6 border-t border-[#edf2ee] pt-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                      Histórico do cadastro
                    </p>

                    <dl className="divide-y divide-[#edf2ee] rounded-2xl border border-[#e6ede9] bg-[#fbfcfb] px-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <dt className="text-[#68756d]">Data de cadastro</dt>
                        <dd className="font-semibold text-[#23322a]">
                          {formatDate(item.criadoEm)}
                        </dd>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <dt className="text-[#68756d]">Última atualização</dt>
                        <dd className="font-semibold text-[#23322a]">
                          {formatDate(item.atualizadoEm)}
                        </dd>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <dt className="text-[#68756d]">Responsável vinculado</dt>
                        <dd className="font-mono text-xs font-semibold text-[#23322a]">
                          Usuário #{item.usuarioId}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>
              </div>

              {/* Coluna direita: mapa ampliado */}
              <aside>
                <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                        Localização no mapa
                      </h2>
                      <p className="mt-0.5 text-sm leading-6 text-[#68756d]">
                        {item.cidade} - {item.uf}
                      </p>
                    </div>

                    {coordenadasValidas ? (
                      <span className="rounded-full border border-[#d6e8dd] bg-[#f2f9f5] px-3 py-1 font-mono text-xs font-medium tabular-nums text-[#15693E]">
                        {latNumero.toFixed(4)}, {lngNumero.toFixed(4)}
                      </span>
                    ) : null}
                  </div>

                  {item.coordenadasEstimadasUf === true ? (
                    <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2.5 text-xs leading-5 text-amber-900">
                      Coordenadas estimadas pela região da UF. Você pode
                      ajustar o ponto exato da propriedade na edição.
                    </p>
                  ) : null}

                  <PropertyLocationPreview
                    latitude={item.latitude}
                    longitude={item.longitude}
                    cidade={item.cidade}
                    uf={item.uf}
                    className="h-[520px] sm:h-[620px] lg:h-[680px]"
                  />

                  <p className="mt-3.5 text-xs text-[#68756d]">
                    Posição geográfica utilizada para monitoramento climático e
                    planejamento logístico.
                  </p>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmOpen && item ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-excluir-detalhe-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="modal-excluir-detalhe-titulo"
                className="text-lg font-semibold text-[#18251e]"
              >
                Remover propriedade?
              </h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg p-1.5 text-[#68756d] transition hover:bg-[#f3f6f4] hover:text-[#18251e] cursor-pointer"
                aria-label="Fechar janela de confirmação"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#5f6d65]">
              Tem certeza de que deseja remover a propriedade{' '}
              <strong className="font-semibold text-[#18251e]">
                {item.nome}
              </strong>{' '}
              ({item.cidade} - {item.uf})? Esta ação realizará uma exclusão
              lógica.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#3f4e45] transition hover:bg-[#f4f8f5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarRemocao()}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
              >
                Confirmar remoção
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.11em] text-[#76847c]">
        {label}
      </dt>
      <dd className="mt-1.5 text-xl font-semibold tracking-[-0.02em] tabular-nums text-[#18251e]">
        {value}
      </dd>
    </div>
  )
}

function formatArea(value: string | number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(num)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}

function formatStatus(status: string) {
  const normalized = status.trim().toUpperCase()
  if (normalized === 'ATIVA') return 'Ativa'
  if (normalized === 'INATIVA') return 'Inativa'
  return status
}

function getStatusStyle(status: string) {
  const normalized = status.trim().toUpperCase()
  if (normalized === 'INATIVA') {
    return 'bg-slate-100 text-slate-700'
  }
  return 'bg-[#edf7f1] text-[#15693E]'
}