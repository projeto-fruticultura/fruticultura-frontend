import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import {
  AppShell,
  PageBreadcrumb,
} from '@/components/app/AppShell'

import {
  LoteForm,
  type LotePayload,
} from '@/components/app/lotes/LoteForm'

export default function NovoLote() {
  const navigate = useNavigate()

  async function handleSubmit(payload: LotePayload) {
    // Futuramente:
    // await loteService.criar(payload)

    console.log('Lote cadastrado:', payload)

    navigate('/lotes', { replace: true })
  }

  return (
    <AppShell section="lotes">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            {
              label: 'Lotes',
              to: '/lotes',
            },
            {
              label: 'Novo lote',
            },
          ]}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/lotes"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
            >
              <ArrowLeft
                size={17}
                aria-hidden="true"
              />

              Voltar para lotes
            </Link>

            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar novo lote
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Preencha os dados abaixo para incluir um lote na produção.
            </p>
          </div>
        </div>

        <LoteForm
          submitLabel="Cadastrar lote"
          onSubmit={handleSubmit}
        />
      </div>
    </AppShell>
  )
}