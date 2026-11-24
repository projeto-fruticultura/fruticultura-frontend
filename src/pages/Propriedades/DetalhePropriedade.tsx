import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  MapPin,
  Ruler,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
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

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Propriedades', to: '/propriedades' },
            { label: item?.nome ?? 'Detalhes' },
          ]}
        />

        <Link
          to="/propriedades"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para propriedades
        </Link>

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
            <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                        {item.nome}
                      </h1>
                      <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#15693E]">
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-sm text-[#68756d]">
                      <MapPin
                        size={16}
                        className="shrink-0 text-[#009B4D]"
                        aria-hidden="true"
                      />
                      {item.cidade} - {item.uf}
                    </p>
                  </div>
                </div>

                {!somenteLeitura && (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/propriedades/${item.id}/editar`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 text-sm font-semibold text-[#15693E] transition hover:bg-[#f1f8f4]"
                    >
                      <Edit3 size={16} aria-hidden="true" />
                      Editar
                    </Link>

                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      disabled={deleting}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={16} aria-hidden="true" />
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

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
              <div className="space-y-5">
                <section className="rounded-[24px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                    Resumo da propriedade
                  </h2>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail
                      label="Área"
                      value={`${item.area} ha`}
                      icon={<Ruler size={18} aria-hidden="true" />}
                    />
                    <Detail label="Lotes" value={String(item.totalLotes)} />
                    <Detail
                      label="Sensores"
                      value={String(item.totalSensores)}
                    />
                    <Detail label="Latitude" value={String(item.latitude)} />
                    <Detail label="Longitude" value={String(item.longitude)} />
                    <Detail
                      label="Atualizado em"
                      value={formatDate(item.atualizadoEm)}
                      icon={<CalendarDays size={18} aria-hidden="true" />}
                    />
                  </dl>
                </section>

                <section className="rounded-[24px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                    Informações do cadastro
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#69766e]">
                    Criada em {formatDate(item.criadoEm)}. Registro vinculado ao
                    usuário #{item.usuarioId}.
                  </p>
                </section>
              </div>

              <section className="rounded-[24px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                  Localização
                </h2>
                <p className="mt-1 mb-5 text-sm leading-6 text-[#69766e]">
                  Prévia da posição geográfica cadastrada.
                </p>
                {item.coordenadasEstimadasUf === true ? (
                  <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">Coordenadas estimadas por região</p>
                ) : null}
                <PropertyLocationPreview
                  latitude={item.latitude}
                  longitude={item.longitude}
                  cidade={item.cidade}
                  uf={item.uf}
                />
              </section>
            </div>
          </>
        ) : null}
      </div>

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

function Detail({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-[#f6f9f7] p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b887f]">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-base font-semibold text-[#29372f]">{value}</dd>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}