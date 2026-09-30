import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { PropertyForm, type PropertyFormInitialValues } from '@/components/propriedades/PropertyForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'

export default function EditarPropriedade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const propertyId = Number(id)
  const [initialValues, setInitialValues] = useState<PropertyFormInitialValues | null>(null)
  const [name, setName] = useState('Propriedade')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      setError('Identificador de propriedade inválido.')
      setLoading(false)
      return
    }

    propriedadeService.buscarPorId(propertyId)
      .then((item) => {
        setName(item.nome)
        setInitialValues({
          nome: item.nome,
          area: item.area,
          cidade: item.cidade,
          uf: item.uf,
          latitude: item.latitude,
          longitude: item.longitude,
        })
      })
      .catch((requestError) => {
        setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar a propriedade.')
      })
      .finally(() => setLoading(false))
  }, [propertyId])

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb items={[{ label: 'Propriedades', to: '/propriedades' }, { label: name, to: `/propriedades/${propertyId}` }, { label: 'Editar' }]} />

        <div className="mb-6">
          <Link to={`/propriedades/${propertyId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]">
            <ArrowLeft size={17} aria-hidden="true" /> Voltar para detalhes
          </Link>
          <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">Editar propriedade</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">Atualize as informações de {name} e salve as alterações.</p>
        </div>

        {loading ? (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-[#e1e7e3] bg-white">
            <div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" /><p className="mt-4 text-sm text-[#6d7a72]">Carregando propriedade...</p></div>
          </div>
        ) : error ? (
          <FeedbackMessage variant="error">{error}</FeedbackMessage>
        ) : initialValues ? (
          <PropertyForm
            initialValues={initialValues}
            submitLabel="Salvar alterações"
            onSubmit={async (payload) => {
              await propriedadeService.atualizar(propertyId, payload)
              navigate(`/propriedades/${propertyId}`, { replace: true })
            }}
          />
        ) : null}
      </div>
    </AppShell>
  )
}
