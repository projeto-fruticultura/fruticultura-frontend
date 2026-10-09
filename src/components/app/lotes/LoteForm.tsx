import { LoaderCircle, Save } from 'lucide-react'
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { culturaService } from '@/services/culturaService'
import { propriedadeService } from '@/services/propriedadeService'
import { rotuloSituacao, SITUACOES_LOTE } from '@/pages/Lotes/situacoes'
import type { Cultura, LotePayload, PropriedadeResumo } from '@/types/api'

export type { LotePayload }

export interface LoteFormInitialValues {
  identificacao?: string
  area?: string | number
  dataPlantacao?: string
  colheitaEstimada?: string | null
  situacao?: string
  propriedadeId?: string | number
  culturaId?: string | number
}

interface LoteFormProps {
  initialValues?: LoteFormInitialValues
  submitLabel: string
  onSubmit: (payload: LotePayload) => Promise<void>
  // Na edicao a propriedade do lote nao muda (o backend ignora), entao o campo fica travado.
  propriedadeBloqueada?: boolean
}

interface LoteFormValores {
  identificacao: string
  area: string
  dataPlantacao: string
  colheitaEstimada: string
  situacao: string
  propriedadeId: string
  culturaId: string
}

function valoresIniciais(initialValues?: LoteFormInitialValues): LoteFormValores {
  return {
    identificacao: String(initialValues?.identificacao ?? ''),
    area: String(initialValues?.area ?? ''),
    dataPlantacao: String(initialValues?.dataPlantacao ?? ''),
    colheitaEstimada: String(initialValues?.colheitaEstimada ?? ''),
    situacao: String(initialValues?.situacao ?? 'PLANTADO'),
    propriedadeId: String(initialValues?.propriedadeId ?? ''),
    culturaId: String(initialValues?.culturaId ?? ''),
  }
}

export function LoteForm({
  initialValues,
  submitLabel,
  onSubmit,
  propriedadeBloqueada = false,
}: LoteFormProps) {
  const formId = useId()

  const [form, setForm] = useState<LoteFormValores>(() => valoresIniciais(initialValues))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)

  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [culturas, setCulturas] = useState<Cultura[]>([])
  const [carregandoListas, setCarregandoListas] = useState(true)
  const [erroListas, setErroListas] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarListas() {
      try {
        const [listaPropriedades, listaCulturas] = await Promise.all([
          propriedadeService.listar(),
          culturaService.listar(),
        ])
        if (!ativo) return
        setPropriedades(listaPropriedades)
        setCulturas(listaCulturas)
      } catch (error) {
        if (ativo) {
          setErroListas(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar as propriedades e as culturas.',
          )
        }
      } finally {
        if (ativo) setCarregandoListas(false)
      }
    }

    carregarListas()

    return () => {
      ativo = false
    }
  }, [])

  function atualizar(campo: keyof LoteFormValores, valor: string) {
    setForm((current) => ({ ...current, [campo]: valor }))
  }

  function validate() {
    const next: Record<string, string> = {}

    const identificacao = form.identificacao.trim()
    if (identificacao.length < 1 || identificacao.length > 100) {
      next.identificacao = 'Informe a identificação do lote (até 100 caracteres).'
    }

    const textoArea = form.area.trim().replace(',', '.')
    const area = Number(textoArea)
    if (!textoArea || !Number.isFinite(area) || area <= 0) {
      next.area = 'Informe uma área maior que zero.'
    } else if (!/^\d+(\.\d{1,2})?$/.test(textoArea)) {
      next.area = 'Use no máximo 2 casas decimais.'
    }

    if (!form.dataPlantacao) {
      next.dataPlantacao = 'Informe a data de plantação.'
    }

    if (
      form.colheitaEstimada &&
      form.dataPlantacao &&
      form.colheitaEstimada < form.dataPlantacao
    ) {
      next.colheitaEstimada = 'A colheita estimada não pode ser antes da plantação.'
    }

    const situacao = form.situacao.trim()
    if (situacao.length < 1 || situacao.length > 30) {
      next.situacao = 'Selecione uma situação válida.'
    }

    const propriedadeId = Number(form.propriedadeId)
    if (!Number.isInteger(propriedadeId) || propriedadeId <= 0) {
      next.propriedadeId = 'Selecione uma propriedade.'
    }

    const culturaId = Number(form.culturaId)
    if (!Number.isInteger(culturaId) || culturaId <= 0) {
      next.culturaId = 'Selecione uma cultura.'
    }

    setErrors(next)

    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    setGeneralError('')

    if (!validate()) return

    setSaving(true)

    try {
      await onSubmit({
        identificacao: form.identificacao.trim(),
        area: Number(form.area.trim().replace(',', '.')),
        dataPlantacao: form.dataPlantacao,
        colheitaEstimada: form.colheitaEstimada || null,
        situacao: form.situacao.trim(),
        propriedadeId: Number(form.propriedadeId),
        culturaId: Number(form.culturaId),
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setGeneralError(error.message)

        if (error.campos) {
          setErrors((current) => ({
            ...current,
            ...error.campos,
          }))
        }
      } else {
        setGeneralError('Não foi possível salvar o lote. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fields = {
    identificacao: `${formId}-identificacao`,
    area: `${formId}-area`,
    dataPlantacao: `${formId}-data-plantacao`,
    colheitaEstimada: `${formId}-colheita-estimada`,
    situacao: `${formId}-situacao`,
    propriedadeId: `${formId}-propriedade`,
    culturaId: `${formId}-cultura`,
  }

  // Situacao fora da lista (lote antigo) continua selecionavel, para a edicao nao apagar o valor sem querer.
  const situacaoForaDaLista =
    form.situacao !== '' &&
    !SITUACOES_LOTE.some((situacao) => situacao.value === form.situacao)

  const semPropriedades = !carregandoListas && !erroListas && propriedades.length === 0
  const semCulturas = !carregandoListas && !erroListas && culturas.length === 0

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">
            {generalError}
          </FeedbackMessage>
        </div>
      ) : null}

      {erroListas ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{erroListas}</FeedbackMessage>
        </div>
      ) : null}

      {semPropriedades ? (
        <div className="mb-5">
          <FeedbackMessage variant="info">
            Você ainda não tem propriedades cadastradas. Cadastre uma propriedade antes de criar um lote.
          </FeedbackMessage>
        </div>
      ) : null}

      {semCulturas ? (
        <div className="mb-5">
          <FeedbackMessage variant="info">
            Ainda não há culturas cadastradas. Cadastre uma cultura antes de criar um lote.
          </FeedbackMessage>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.7fr)]">
        <div className="space-y-6">
          {/* Dados do lote */}
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Dados do lote
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6a776f]">
                Informe os dados básicos utilizados para identificar e
                acompanhar o lote.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Identificação"
                required
                error={errors.identificacao}
                className="sm:col-span-2"
                htmlFor={fields.identificacao}
              >
                <input
                  id={fields.identificacao}
                  value={form.identificacao}
                  onChange={(event) => atualizar('identificacao', event.target.value)}
                  className="input-propriedade"
                  placeholder="Ex.: Lote 01"
                  aria-invalid={Boolean(errors.identificacao)}
                  aria-describedby={
                    errors.identificacao
                      ? `${fields.identificacao}-error`
                      : undefined
                  }
                />
              </Field>

              <Field
                label="Área (ha)"
                required
                error={errors.area}
                htmlFor={fields.area}
              >
                <input
                  id={fields.area}
                  inputMode="decimal"
                  value={form.area}
                  onChange={(event) => atualizar('area', event.target.value)}
                  className="input-propriedade"
                  placeholder="Ex.: 12.5"
                  aria-invalid={Boolean(errors.area)}
                  aria-describedby={
                    errors.area ? `${fields.area}-error` : undefined
                  }
                />
              </Field>

              <Field
                label="Data de plantação"
                required
                error={errors.dataPlantacao}
                htmlFor={fields.dataPlantacao}
              >
                <input
                  id={fields.dataPlantacao}
                  type="date"
                  value={form.dataPlantacao}
                  onChange={(event) => atualizar('dataPlantacao', event.target.value)}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.dataPlantacao)}
                  aria-describedby={
                    errors.dataPlantacao
                      ? `${fields.dataPlantacao}-error`
                      : undefined
                  }
                />
              </Field>

              <Field
                label="Colheita estimada (opcional)"
                error={errors.colheitaEstimada}
                htmlFor={fields.colheitaEstimada}
              >
                <input
                  id={fields.colheitaEstimada}
                  type="date"
                  value={form.colheitaEstimada}
                  onChange={(event) => atualizar('colheitaEstimada', event.target.value)}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.colheitaEstimada)}
                  aria-describedby={
                    errors.colheitaEstimada
                      ? `${fields.colheitaEstimada}-error`
                      : undefined
                  }
                />
              </Field>

              <Field
                label="Situação"
                required
                error={errors.situacao}
                htmlFor={fields.situacao}
              >
                <select
                  id={fields.situacao}
                  value={form.situacao}
                  onChange={(event) => atualizar('situacao', event.target.value)}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.situacao)}
                  aria-describedby={
                    errors.situacao
                      ? `${fields.situacao}-error`
                      : undefined
                  }
                >
                  {SITUACOES_LOTE.map((situacao) => (
                    <option
                      key={situacao.value}
                      value={situacao.value}
                    >
                      {situacao.label}
                    </option>
                  ))}

                  {situacaoForaDaLista ? (
                    <option value={form.situacao}>
                      {rotuloSituacao(form.situacao)}
                    </option>
                  ) : null}
                </select>
              </Field>
            </div>
          </section>

          {/* Vínculos */}
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Vínculos
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6a776f]">
                {propriedadeBloqueada
                  ? 'A propriedade de um lote não pode ser trocada. Você pode mudar a cultura.'
                  : 'Selecione a propriedade e a cultura relacionadas a este lote.'}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Propriedade"
                required
                error={errors.propriedadeId}
                htmlFor={fields.propriedadeId}
              >
                <select
                  id={fields.propriedadeId}
                  value={form.propriedadeId}
                  onChange={(event) => atualizar('propriedadeId', event.target.value)}
                  disabled={carregandoListas || propriedadeBloqueada}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.propriedadeId)}
                  aria-describedby={
                    errors.propriedadeId
                      ? `${fields.propriedadeId}-error`
                      : undefined
                  }
                >
                  <option value="">
                    {carregandoListas ? 'Carregando...' : 'Selecione uma propriedade'}
                  </option>

                  {propriedades.map((propriedade) => (
                    <option
                      key={propriedade.id}
                      value={propriedade.id}
                    >
                      {propriedade.nome}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Cultura"
                required
                error={errors.culturaId}
                htmlFor={fields.culturaId}
              >
                <select
                  id={fields.culturaId}
                  value={form.culturaId}
                  onChange={(event) => atualizar('culturaId', event.target.value)}
                  disabled={carregandoListas}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.culturaId)}
                  aria-describedby={
                    errors.culturaId
                      ? `${fields.culturaId}-error`
                      : undefined
                  }
                >
                  <option value="">
                    {carregandoListas ? 'Carregando...' : 'Selecione uma cultura'}
                  </option>

                  {culturas.map((cultura) => (
                    <option
                      key={cultura.id}
                      value={cultura.id}
                    >
                      {cultura.variedade ? `${cultura.nome} (${cultura.variedade})` : cultura.nome}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
        </div>

        {/* Resumo */}
        <aside className="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
              Resumo do lote
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6a776f]">
              Confira as principais informações antes de salvar o cadastro.
            </p>

            <div className="mt-5 space-y-4">
              <SummaryItem
                label="Identificação"
                value={form.identificacao || 'Não informado'}
              />

              <SummaryItem
                label="Área"
                value={form.area ? `${form.area} ha` : 'Não informado'}
              />

              <SummaryItem
                label="Propriedade"
                value={
                  propriedades.find(
                    (item) => String(item.id) === form.propriedadeId,
                  )?.nome ?? 'Não selecionada'
                }
              />

              <SummaryItem
                label="Cultura"
                value={
                  culturas.find(
                    (item) => String(item.id) === form.culturaId,
                  )?.nome ?? 'Não selecionada'
                }
              />

              <SummaryItem
                label="Situação"
                value={form.situacao ? rotuloSituacao(form.situacao) : 'Não informada'}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
            <button
              type="submit"
              disabled={saving || carregandoListas}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}

              {saving ? 'Salvando...' : submitLabel}
            </button>
          </div>
        </aside>
      </div>
    </form>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-b border-[#edf1ee] pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7a867f]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[#25332b]">
        {value}
      </p>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-[#334139]"
      >
        {label}

        {required ? (
          <span
            className="ml-1 text-[#009B4D]"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}

        {required ? (
          <span className="sr-only"> (obrigatório)</span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
