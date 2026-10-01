import { ArrowLeft, CalendarDays, Edit3, MapPin, Ruler, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { PropertyLocationPreview } from '@/components/propriedades/PropertyLocationPreview'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeDetalhe } from '@/types/api'

export default function DetalhePropriedade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const propertyId = Number(id)
  const [item, setItem] = useState<PropriedadeDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      setError('Identificador de propriedade inválido.')
      setLoading(false)
      return
    }

    propriedadeService.buscarPorId(propertyId)
      .then(setItem)
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar a propriedade.'))
      .finally(() => setLoading(false))
  }, [propertyId])

  async function remove() {
    if (!item || !window.confirm(`Excluir a propriedade “${item.nome}”? Esta ação fará uma exclusão lógica.`)) return
    setDeleting(true)
    setError('')
    try {
      await propriedadeService.remover(item.id)
      navigate('/propriedades', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível remover a propriedade.')
      setDeleting(false)
    }
  }

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb items={[{ label: 'Propriedades', to: '/propriedades' }, { label: item?.nome ?? 'Detalhes' }]} />

        {loading ? (
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-[#e1e7e3] bg-white">
            <div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" /><p className="mt-4 text-sm text-[#6d7a72]">Carregando propriedade...</p></div>
          </div>
        ) : error && !item ? (
          <FeedbackMessage variant="error">{error}</FeedbackMessage>
        ) : item ? (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link to="/propriedades" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]">
                  <ArrowLeft size={17} aria-hidden="true" /> Voltar para propriedades
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">{item.nome}</h1>
                  <span className="rounded-full bg-[#eaf7ef] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0b7c49]">{item.status}</span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#68756d]"><MapPin size={16} /> {item.cidade} - {item.uf}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/propriedades/${item.id}/editar`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8e3dc] bg-white px-4 text-sm font-semibold text-[#15693E] transition hover:bg-[#f1f8f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]">
                  <Edit3 size={17} /> Editar
                </Link>
                <button type="button" onClick={() => void remove()} disabled={deleting} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 cursor-pointer">
                  <Trash2 size={17} /> {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>

            {error ? <div className="mt-5"><FeedbackMessage variant="error">{error}</FeedbackMessage></div> : null}

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
              <div className="space-y-5">
                <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-[#1c2922]">Resumo da propriedade</h2>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Área" value={`${item.area} ha`} icon={<Ruler size={18} />} />
                    <Detail label="Lotes" value={String(item.totalLotes)} />
                    <Detail label="Sensores" value={String(item.totalSensores)} />
                    <Detail label="Latitude" value={String(item.latitude)} />
                    <Detail label="Longitude" value={String(item.longitude)} />
                    <Detail label="Atualizado em" value={formatDate(item.atualizadoEm)} icon={<CalendarDays size={18} />} />
                  </dl>
                </section>

                <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-[#1c2922]">Informações do cadastro</h2>
                  <p className="mt-2 text-sm leading-6 text-[#69766e]">Criada em {formatDate(item.criadoEm)}. Registro vinculado ao usuário #{item.usuarioId}.</p>
                </section>
              </div>

              <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold text-[#1c2922]">Localização</h2>
                <p className="mt-1 mb-5 text-sm leading-6 text-[#69766e]">Prévia da posição geográfica cadastrada.</p>
                <PropertyLocationPreview latitude={item.latitude} longitude={item.longitude} cidade={item.cidade} uf={item.uf} />
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#f6f9f7] p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b887f]">{icon}{label}</dt>
      <dd className="mt-2 text-base font-semibold text-[#29372f]">{value}</dd>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}
