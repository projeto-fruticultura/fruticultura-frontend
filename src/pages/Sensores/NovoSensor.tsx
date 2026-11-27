import { useNavigate } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { SensorForm, type SensorPayload } from '@/components/app/sensores/SensorForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { podeEscrever } from '@/lib/permissoes'
import { sensorService } from '@/services/sensorService'

export default function NovoSensor() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  async function handleSubmit(payload: SensorPayload) {
    // Erros (inclusive o 409 de código repetido) sobem para o SensorForm, que mostra a mensagem.
    await sensorService.criar(payload)
    navigate('/sensores', { replace: true })
  }

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Sensores', to: '/sensores' },
            { label: 'Novo sensor' },
          ]}
        />

        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar novo sensor
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre um sensor e vincule-o a um lote para acompanhar as
              medições climáticas.
            </p>
          </div>
        </section>

        {podeEscrever(usuario?.perfil) ? (
            <SensorForm submitLabel="Cadastrar sensor" onSubmit={handleSubmit} />
        ) : (
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="info">
              Seu perfil não tem permissão para cadastrar sensores.
            </FeedbackMessage>
          </div>
        )}
      </div>
    </AppShell>
  )
}