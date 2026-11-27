import { useNavigate } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { PropertyForm } from '@/components/propriedades/PropertyForm'
import { propriedadeService } from '@/services/propriedadeService'

export default function NovaPropriedade() {
  const navigate = useNavigate()

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Propriedades', to: '/propriedades' },
            { label: 'Nova propriedade' },
          ]}
        />

        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar nova propriedade
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre uma unidade produtiva para gerenciar lotes, clima, colheita e exportação.
            </p>
          </div>
        </section>

        <PropertyForm
          submitLabel="Cadastrar propriedade"
          cancelTo="/propriedades"
          onSubmit={async (payload) => {
            await propriedadeService.criar(payload)
            navigate('/propriedades', { replace: true })
          }}
        />
      </div>
    </AppShell>
  )
}