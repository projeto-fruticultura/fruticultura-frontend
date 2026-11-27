import { useEffect, useState } from 'react'
import {  useNavigate, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import {
  PropertyForm,
  type PropertyFormInitialValues,
} from '@/components/propriedades/PropertyForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'

export default function EditarPropriedade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const propertyId = Number(id)

  const [initialValues, setInitialValues] =
    useState<PropertyFormInitialValues | null>(null)
  const [name, setName] = useState('Propriedade')
  const [loading, setLoading] = useState(true)
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
      .then((item) => {
        if (!ativo) return
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

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Propriedades', to: '/propriedades' },
            { label: name, to: `/propriedades/${propertyId}` },
            { label: 'Editar' },
          ]}
        />

        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Editar propriedade
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Atualize os dados cadastrais, localização e área de {name} e
                  salve as alterações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
            <div className="text-center" role="status" aria-live="polite">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
              <p className="mt-4 text-sm text-[#6d7a72]">
                Carregando propriedade...
              </p>
            </div>
          </div>
        ) : error ? (
          <FeedbackMessage variant="error">{error}</FeedbackMessage>
        ) : initialValues ? (
          <section
            aria-label="Formulário de edição de propriedade"
            className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7 lg:p-8"
          >
            <PropertyForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              onSubmit={async (payload) => {
                await propriedadeService.atualizar(propertyId, payload)
                navigate(`/propriedades/${propertyId}`, { replace: true })
              }}
            />
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}