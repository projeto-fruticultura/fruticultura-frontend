import { ArrowLeft, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { LoteForm, type LotePayload } from '@/components/app/lotes/LoteForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { loteService } from '@/services/loteService'
import type { Lote } from '@/types/api'

export default function EditarLote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const loteId = Number(id)
  const idValido = Number.isInteger(loteId) && loteId > 0

  const [lote, setLote] = useState<Lote | null>(null)
  const [carregando, setCarregando] = useState(idValido)
  const [erro, setErro] = useState(idValido ? '' : 'Identificador de lote inválido.')

  useEffect(() => {
    if (!idValido) return

    let ativo = true

    async function carregarLote() {
      try {
        const dados = await loteService.buscarPorId(loteId)
        if (ativo) setLote(dados)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar o lote.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarLote()

    return () => {
      ativo = false
    }
  }, [loteId, idValido])

  async function handleSubmit(payload: LotePayload) {
    // A propriedade nao muda: so os outros campos vao no PUT.
    const { identificacao, area, dataPlantacao, colheitaEstimada, situacao, culturaId } = payload
    await loteService.atualizar(loteId, {
      identificacao,
      area,
      dataPlantacao,
      colheitaEstimada,
      situacao,
      culturaId,
    })

    navigate('/lotes', { replace: true })
  }

  return (
    <AppShell section="lotes">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Lotes', to: '/lotes' },
            { label: lote?.identificacao || 'Lote' },
            { label: 'Editar' },
          ]}
        />

        <Link
          to="/lotes"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para lotes
        </Link>

        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <MapPin size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Editar lote
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Atualize as informações de {lote?.identificacao || 'seu lote'} e
                  salve as alterações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {carregando ? (
          <p className="text-sm text-[#68756d]" role="status">
            Carregando lote...
          </p>
        ) : erro ? (
          <FeedbackMessage variant="error">{erro}</FeedbackMessage>
        ) : !podeEscrever(usuario?.perfil) ? (
          <FeedbackMessage variant="info">
            Seu perfil não tem permissão para editar lotes.
          </FeedbackMessage>
        ) : lote ? (
          <LoteForm
            submitLabel="Salvar alterações"
            onSubmit={handleSubmit}
            propriedadeBloqueada
            initialValues={{
              identificacao: lote.identificacao,
              area: lote.area,
              dataPlantacao: lote.dataPlantacao,
              colheitaEstimada: lote.colheitaEstimada,
              situacao: lote.situacao,
              propriedadeId: lote.propriedadeId,
              culturaId: lote.culturaId,
            }}
          />
        ) : null}
      </div>
    </AppShell>
  )
}