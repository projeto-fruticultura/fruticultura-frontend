import { ArrowLeft, Leaf } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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

        <Link
          to="/propriedades"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para propriedades
        </Link>

        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <Leaf size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Adicionar nova propriedade
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Cadastre uma nova unidade produtiva ou fazenda no Vale do São
                  Francisco para iniciar o monitoramento de lotes e sensores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Container do formulário */}
        <section
          aria-label="Formulário de cadastro de propriedade"
          className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7 lg:p-8"
        >
          <div className="mb-6 flex flex-col gap-1 border-b border-[#edf1ee] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Dados da unidade produtiva
              </h2>
              <p className="mt-0.5 text-xs text-[#718078]">
                Informe identificação, localização geográfica e área total da
                propriedade.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-[#f3f6f4] px-3 py-1 text-[11px] font-semibold text-[#526058]">
              Cadastro inicial
            </span>
          </div>

          <PropertyForm
            submitLabel="Cadastrar propriedade"
            onSubmit={async (payload) => {
              await propriedadeService.criar(payload)
              navigate('/propriedades', { replace: true })
            }}
          />
        </section>
      </div>
    </AppShell>
  )
}