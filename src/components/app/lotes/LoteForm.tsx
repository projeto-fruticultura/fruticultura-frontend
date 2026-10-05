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

export interface LotePayload {
  identificacao: string
  area: number
  data_plantacao: string
  situacao: string
  propriedade_id: number
  cultura_id: number
}

export interface LoteFormInitialValues {
  identificacao?: string
  area?: string | number
  data_plantacao?: string
  situacao?: string
  propriedade_id?: string | number
  cultura_id?: string | number
}

interface LoteFormProps {
  initialValues?: LoteFormInitialValues
  submitLabel: string
  onSubmit: (payload: LotePayload) => Promise<void>
}

const SITUACOES = [
  { value: 'EM_PREPARACAO', label: 'Em preparação' },
  { value: 'PLANTADO', label: 'Plantado' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'EM_COLHEITA', label: 'Em colheita' },
  { value: 'EM_DESCANSO', label: 'Em descanso' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

/*
 * Mock temporário.
 * Depois, esses dados podem ser substituídos por chamadas à API:
 *
 * GET /propriedades
 * GET /culturas
 */
const PROPRIEDADES = [
  {
    id: 1,
    nome: 'Fazenda São José',
  },
  {
    id: 2,
    nome: 'Fazenda Boa Vista',
  },
]

const CULTURAS = [
  {
    id: 1,
    nome: 'Manga',
  },
  {
    id: 2,
    nome: 'Uva',
  },
  {
    id: 3,
    nome: 'Goiaba',
  },
]

export function LoteForm({
  initialValues,
  submitLabel,
  onSubmit,
}: LoteFormProps) {
  const formId = useId()

  const [form, setForm] = useState({
    identificacao: String(initialValues?.identificacao ?? ''),
    area: String(initialValues?.area ?? ''),
    data_plantacao: String(initialValues?.data_plantacao ?? ''),
    situacao: String(initialValues?.situacao ?? 'PLANTADO'),
    propriedade_id: String(initialValues?.propriedade_id ?? ''),
    cultura_id: String(initialValues?.cultura_id ?? ''),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      identificacao: String(initialValues?.identificacao ?? ''),
      area: String(initialValues?.area ?? ''),
      data_plantacao: String(initialValues?.data_plantacao ?? ''),
      situacao: String(initialValues?.situacao ?? 'PLANTADO'),
      propriedade_id: String(initialValues?.propriedade_id ?? ''),
      cultura_id: String(initialValues?.cultura_id ?? ''),
    })
  }, [initialValues])

  function validate() {
    const next: Record<string, string> = {}

    const area = Number(form.area)
    const propriedadeId = Number(form.propriedade_id)
    const culturaId = Number(form.cultura_id)

    if (form.identificacao.trim().length < 2) {
      next.identificacao = 'Informe a identificação do lote.'
    }

    if (!Number.isFinite(area) || area <= 0) {
      next.area = 'Informe uma área maior que zero.'
    }

    if (!form.data_plantacao) {
      next.data_plantacao = 'Informe a data de plantação.'
    }

    if (!SITUACOES.some((situacao) => situacao.value === form.situacao)) {
      next.situacao = 'Selecione uma situação válida.'
    }

    if (!Number.isInteger(propriedadeId) || propriedadeId <= 0) {
      next.propriedade_id = 'Selecione uma propriedade.'
    }

    if (!Number.isInteger(culturaId) || culturaId <= 0) {
      next.cultura_id = 'Selecione uma cultura.'
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
        area: Number(form.area),
        data_plantacao: form.data_plantacao,
        situacao: form.situacao,
        propriedade_id: Number(form.propriedade_id),
        cultura_id: Number(form.cultura_id),
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
    data_plantacao: `${formId}-data-plantacao`,
    situacao: `${formId}-situacao`,
    propriedade_id: `${formId}-propriedade`,
    cultura_id: `${formId}-cultura`,
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">
            {generalError}
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      identificacao: event.target.value,
                    }))
                  }
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
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
                error={errors.data_plantacao}
                htmlFor={fields.data_plantacao}
              >
                <input
                  id={fields.data_plantacao}
                  type="date"
                  value={form.data_plantacao}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      data_plantacao: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.data_plantacao)}
                  aria-describedby={
                    errors.data_plantacao
                      ? `${fields.data_plantacao}-error`
                      : undefined
                  }
                />
              </Field>

              <Field
                label="Situação"
                required
                error={errors.situacao}
                className="sm:col-span-2"
                htmlFor={fields.situacao}
              >
                <select
                  id={fields.situacao}
                  value={form.situacao}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      situacao: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.situacao)}
                  aria-describedby={
                    errors.situacao
                      ? `${fields.situacao}-error`
                      : undefined
                  }
                >
                  {SITUACOES.map((situacao) => (
                    <option
                      key={situacao.value}
                      value={situacao.value}
                    >
                      {situacao.label}
                    </option>
                  ))}
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
                Selecione a propriedade e a cultura relacionadas a este lote.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Propriedade"
                required
                error={errors.propriedade_id}
                htmlFor={fields.propriedade_id}
              >
                <select
                  id={fields.propriedade_id}
                  value={form.propriedade_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      propriedade_id: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.propriedade_id)}
                  aria-describedby={
                    errors.propriedade_id
                      ? `${fields.propriedade_id}-error`
                      : undefined
                  }
                >
                  <option value="">Selecione uma propriedade</option>

                  {PROPRIEDADES.map((propriedade) => (
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
                error={errors.cultura_id}
                htmlFor={fields.cultura_id}
              >
                <select
                  id={fields.cultura_id}
                  value={form.cultura_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cultura_id: event.target.value,
                    }))
                  }
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.cultura_id)}
                  aria-describedby={
                    errors.cultura_id
                      ? `${fields.cultura_id}-error`
                      : undefined
                  }
                >
                  <option value="">Selecione uma cultura</option>

                  {CULTURAS.map((cultura) => (
                    <option
                      key={cultura.id}
                      value={cultura.id}
                    >
                      {cultura.nome}
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
                  PROPRIEDADES.find(
                    (item) => String(item.id) === form.propriedade_id,
                  )?.nome ?? 'Não selecionada'
                }
              />

              <SummaryItem
                label="Cultura"
                value={
                  CULTURAS.find(
                    (item) => String(item.id) === form.cultura_id,
                  )?.nome ?? 'Não selecionada'
                }
              />

              <SummaryItem
                label="Situação"
                value={
                  SITUACOES.find(
                    (item) => item.value === form.situacao,
                  )?.label ?? 'Não informada'
                }
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
            <button
              type="submit"
              disabled={saving}
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