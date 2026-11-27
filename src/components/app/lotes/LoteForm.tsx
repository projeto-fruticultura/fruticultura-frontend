import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { rotuloSituacao, SITUACOES_LOTE } from '@/pages/Lotes/situacoes'
import { ApiError } from '@/services/api'
import { culturaService } from '@/services/culturaService'
import { propriedadeService } from '@/services/propriedadeService'
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
  cancelTo?: string
  onSubmit: (payload: LotePayload) => Promise<void>
  // Na edição a propriedade do lote não muda (o backend ignora), então o campo fica travado.
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
  cancelTo = '/lotes',
  onSubmit,
  propriedadeBloqueada = false,
}: LoteFormProps) {
  const formId = useId()

  const [form, setForm] = useState<LoteFormValores>(() =>
    valoresIniciais(initialValues),
  )
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

    void carregarListas()

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
      next.identificacao =
        'Informe a identificação do lote (até 100 caracteres).'
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
      next.colheitaEstimada =
        'A colheita estimada não pode ser antes da plantação.'
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

  // Situação fora da lista (lote antigo) continua selecionável para a edição não apagar o valor.
  const situacaoForaDaLista =
    form.situacao !== '' &&
    !SITUACOES_LOTE.some((situacao) => situacao.value === form.situacao)

  const semPropriedades =
    !carregandoListas && !erroListas && propriedades.length === 0
  const semCulturas =
    !carregandoListas && !erroListas && culturas.length === 0

  const propriedadeSelecionada = propriedades.find(
    (item) => String(item.id) === form.propriedadeId,
  )
  const culturaSelecionada = culturas.find(
    (item) => String(item.id) === form.culturaId,
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
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
            Você ainda não tem propriedades cadastradas. Cadastre uma
            propriedade antes de criar um lote.
          </FeedbackMessage>
        </div>
      ) : null}

      {semCulturas ? (
        <div className="mb-5">
          <FeedbackMessage variant="info">
            Ainda não há culturas cadastradas. Cadastre uma cultura antes de
            criar um lote.
          </FeedbackMessage>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        {/* Coluna esquerda: formulário estruturado */}
        <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-6">
            <div className="border-b border-[#edf2ee] pb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                Especificações do talhão
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#68756d]">
                Preencha os dados operacionais e vincule a propriedade e a
                cultura cultivada.
              </p>
            </div>

            {/* Grupo 1: Dados do lote */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Identificação e cronograma
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Identificação do lote"
                  required
                  error={errors.identificacao}
                  className="sm:col-span-2"
                  htmlFor={fields.identificacao}
                >
                  <input
                    id={fields.identificacao}
                    value={form.identificacao}
                    onChange={(event) =>
                      atualizar('identificacao', event.target.value)
                    }
                    className={inputClass(Boolean(errors.identificacao))}
                    placeholder="Ex.: Talhão Norte 01"
                    aria-invalid={Boolean(errors.identificacao)}
                    aria-describedby={
                      errors.identificacao
                        ? `${fields.identificacao}-error`
                        : undefined
                    }
                  />
                </Field>

                <Field
                  label="Área cultivada"
                  required
                  error={errors.area}
                  htmlFor={fields.area}
                >
                  <div className="relative">
                    <input
                      id={fields.area}
                      inputMode="decimal"
                      value={form.area}
                      onChange={(event) =>
                        atualizar('area', event.target.value)
                      }
                      className={`${inputClass(Boolean(errors.area))} pr-12 tabular-nums`}
                      placeholder="Ex.: 12,5"
                      aria-invalid={Boolean(errors.area)}
                      aria-describedby={
                        errors.area ? `${fields.area}-error` : undefined
                      }
                    />
                    <span className="pointer-events-none absolute inset-y-2.5 right-0 flex w-10 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                      ha
                    </span>
                  </div>
                </Field>

                <Field
                  label="Situação atual"
                  required
                  error={errors.situacao}
                  htmlFor={fields.situacao}
                >
                  <select
                    id={fields.situacao}
                    value={form.situacao}
                    onChange={(event) =>
                      atualizar('situacao', event.target.value)
                    }
                    className={inputClass(Boolean(errors.situacao))}
                    aria-invalid={Boolean(errors.situacao)}
                    aria-describedby={
                      errors.situacao ? `${fields.situacao}-error` : undefined
                    }
                  >
                    {SITUACOES_LOTE.map((situacao) => (
                      <option key={situacao.value} value={situacao.value}>
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
                    onChange={(event) =>
                      atualizar('dataPlantacao', event.target.value)
                    }
                    className={`${inputClass(Boolean(errors.dataPlantacao))} tabular-nums`}
                    aria-invalid={Boolean(errors.dataPlantacao)}
                    aria-describedby={
                      errors.dataPlantacao
                        ? `${fields.dataPlantacao}-error`
                        : undefined
                    }
                  />
                </Field>

                <Field
                  label="Colheita estimada"
                  error={errors.colheitaEstimada}
                  htmlFor={fields.colheitaEstimada}
                >
                  <input
                    id={fields.colheitaEstimada}
                    type="date"
                    value={form.colheitaEstimada}
                    onChange={(event) =>
                      atualizar('colheitaEstimada', event.target.value)
                    }
                    className={`${inputClass(Boolean(errors.colheitaEstimada))} tabular-nums`}
                    aria-invalid={Boolean(errors.colheitaEstimada)}
                    aria-describedby={
                      errors.colheitaEstimada
                        ? `${fields.colheitaEstimada}-error`
                        : undefined
                    }
                  />
                </Field>
              </div>
            </div>

            {/* Grupo 2: Vínculos */}
            <div className="space-y-4 border-t border-[#edf2ee] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Vínculos produtivos
                </p>

                {propriedadeBloqueada ? (
                  <span className="rounded-full bg-[#f2f5f3] px-2.5 py-0.5 text-[11px] font-semibold text-[#5c6b63]">
                    Propriedade fixa na edição
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Propriedade"
                  required
                  error={errors.propriedadeId}
                  htmlFor={fields.propriedadeId}
                >
                  <select
                    id={fields.propriedadeId}
                    value={form.propriedadeId}
                    onChange={(event) =>
                      atualizar('propriedadeId', event.target.value)
                    }
                    disabled={carregandoListas || propriedadeBloqueada}
                    className={`${inputClass(Boolean(errors.propriedadeId))} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                    aria-invalid={Boolean(errors.propriedadeId)}
                    aria-describedby={
                      errors.propriedadeId
                        ? `${fields.propriedadeId}-error`
                        : undefined
                    }
                  >
                    <option value="">
                      {carregandoListas
                        ? 'Carregando...'
                        : 'Selecione uma propriedade'}
                    </option>

                    {propriedades.map((propriedade) => (
                      <option key={propriedade.id} value={propriedade.id}>
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
                    onChange={(event) =>
                      atualizar('culturaId', event.target.value)
                    }
                    disabled={carregandoListas}
                    className={`${inputClass(Boolean(errors.culturaId))} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                    aria-invalid={Boolean(errors.culturaId)}
                    aria-describedby={
                      errors.culturaId ? `${fields.culturaId}-error` : undefined
                    }
                  >
                    <option value="">
                      {carregandoListas
                        ? 'Carregando...'
                        : 'Selecione uma cultura'}
                    </option>

                    {culturas.map((cultura) => (
                      <option key={cultura.id} value={cultura.id}>
                        {cultura.variedade
                          ? `${cultura.nome} (${cultura.variedade})`
                          : cultura.nome}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna direita: resumo + ações */}
        <aside>
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-[#edf2ee] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                  Resumo do lote
                </h2>

                {form.situacao ? (
                  <span className="rounded-full bg-[#edf7f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#15693E]">
                    {rotuloSituacao(form.situacao)}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm leading-6 text-[#68756d]">
                {form.identificacao.trim() ||
                  'Confira os dados antes de concluir o registro.'}
              </p>
            </div>

            <dl className="mt-5 divide-y divide-[#edf2ee] rounded-2xl border border-[#e6ede9] bg-[#f8faf9] px-4">
              <SummaryItem
                label="Identificação"
                value={form.identificacao.trim() || 'Não informada'}
              />

              <SummaryItem
                label="Área cultivada"
                value={formatarAreaPreview(form.area)}
                tabular
              />

              <SummaryItem
                label="Propriedade"
                value={propriedadeSelecionada?.nome ?? 'Não selecionada'}
              />

              <SummaryItem
                label="Cultura"
                value={
                  culturaSelecionada
                    ? culturaSelecionada.variedade
                      ? `${culturaSelecionada.nome} (${culturaSelecionada.variedade})`
                      : culturaSelecionada.nome
                    : 'Não selecionada'
                }
              />

              <SummaryItem
                label="Plantação"
                value={formatarDataPreview(form.dataPlantacao)}
                tabular
              />

              <SummaryItem
                label="Colheita estimada"
                value={
                  form.colheitaEstimada
                    ? formatarDataPreview(form.colheitaEstimada)
                    : 'Não definida'
                }
                tabular
              />
            </dl>

            {/* Barra de ações */}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#edf2ee] pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to={cancelTo}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving || carregandoListas}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#009B4D] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : submitLabel}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return `min-h-12 w-full rounded-xl border bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:bg-white focus:ring-4 ${
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-[#dce5df] focus:border-[#009B4D] focus:ring-[#009B4D]/10'
  }`
}

function formatarAreaPreview(areaStr: string) {
  const texto = areaStr.trim().replace(',', '.')
  const num = Number(texto)
  if (!texto || !Number.isFinite(num) || num <= 0) {
    return 'Não informada'
  }
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(num)} ha`
}

function formatarDataPreview(isoDate: string) {
  if (!isoDate) return 'Não informada'
  const partes = isoDate.split('-')
  if (partes.length !== 3) return isoDate
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function SummaryItem({
  label,
  value,
  tabular = false,
}: {
  label: string
  value: string
  tabular?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
      <dt className="text-[#68756d]">{label}</dt>
      <dd
        className={`font-semibold text-[#18251e] ${tabular ? 'tabular-nums' : ''}`}
      >
        {value}
      </dd>
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
        className="mb-2 block text-sm font-semibold text-[#2d3b33]"
      >
        {label}

        {required ? (
          <span className="ml-1 text-[#009B4D]" aria-hidden="true">
            *
          </span>
        ) : null}

        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}