import {  MapPin } from 'lucide-react'
import {  useNavigate } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { LoteForm, type LotePayload } from '@/components/app/lotes/LoteForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { podeEscrever } from '@/lib/permissoes'
import { loteService } from '@/services/loteService'

export default function NovoLote() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  async function handleSubmit(payload: LotePayload) {
    // Erros (inclusive os de campo) sobem para o LoteForm, que mostra a mensagem.
    await loteService.criar(payload)

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


        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <MapPin size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Adicionar novo lote
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Preencha os dados abaixo para incluir um lote na produção.
                </p>
              </div>
            </div>
          </div>
        </section>

        {podeEscrever(usuario?.perfil) ? (
          <LoteForm submitLabel="Cadastrar lote" onSubmit={handleSubmit} />
        ) : (
          <FeedbackMessage variant="info">
            Seu perfil não tem permissão para cadastrar lotes.
          </FeedbackMessage>
        )}
      </div>
    </AppShell>
  )
}