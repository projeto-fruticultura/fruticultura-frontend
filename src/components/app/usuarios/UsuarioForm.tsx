import { LoaderCircle, Save } from 'lucide-react'
import {
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import type { PerfilUsuario, UsuarioPayload } from '@/types/api'

export type { UsuarioPayload }

export interface UsuarioFormInitialValues {
  nome?: string
  email?: string
  perfil?: PerfilUsuario
}

interface UsuarioFormProps {
  initialValues?: UsuarioFormInitialValues
  submitLabel: string
  onSubmit: (payload: UsuarioPayload) => Promise<void>
}

interface UsuarioFormValores {
  nome: string
  email: string
  senha: string
  perfil: string
}

function valoresIniciais(initialValues?: UsuarioFormInitialValues): UsuarioFormValores {
  return {
    nome: initialValues?.nome ?? '',
    email: initialValues?.email ?? '',
    senha: '',
    perfil: initialValues?.perfil ?? 'PRODUTOR',
  }
}

export function UsuarioForm({
  initialValues,
  submitLabel,
  onSubmit,
}: UsuarioFormProps) {
  const formId = useId()

  const [form, setForm] = useState<UsuarioFormValores>(() => valoresIniciais(initialValues))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)

  function atualizar(campo: keyof UsuarioFormValores, valor: string) {
    setForm((current) => ({ ...current, [campo]: valor }))
  }

  function validate() {
    const next: Record<string, string> = {}

    const nome = form.nome.trim()
    if (!nome) {
      next.nome = 'O nome é obrigatório.'
    } else if (nome.length > 150) {
      next.nome = 'O nome deve ter no máximo 150 caracteres.'
    }

    const email = form.email.trim()
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      next.email = 'O e-mail é obrigatório.'
    } else if (!regexEmail.test(email)) {
      next.email = 'Informe um formato de e-mail válido (ex.: nome@dominio.com).'
    }

    const senha = form.senha
    if (!senha) {
      next.senha = 'A senha inicial é obrigatória.'
    } else if (senha.length < 8) {
      next.senha = 'A senha deve ter pelo menos 8 caracteres.'
    }

    if (!form.perfil) {
      next.perfil = 'Selecione um perfil de acesso.'
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
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        perfil: form.perfil as PerfilUsuario,
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
        setGeneralError('Não foi possível salvar o usuário. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  const fields = {
    nome: `${formId}-nome`,
    email: `${formId}-email`,
    senha: `${formId}-senha`,
    perfil: `${formId}-perfil`,
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.7fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
                Dados do usuário
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#6a776f]">
                Informe as credenciais e o nível de acesso para o novo usuário da plataforma.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nome completo"
                required
                error={errors.nome}
                className="sm:col-span-2"
                htmlFor={fields.nome}
              >
                <input
                  id={fields.nome}
                  value={form.nome}
                  onChange={(event) => atualizar('nome', event.target.value)}
                  className="input-propriedade"
                  placeholder="Ex.: João da Silva"
                  aria-invalid={Boolean(errors.nome)}
                />
              </Field>

              <Field
                label="E-mail"
                required
                error={errors.email}
                className="sm:col-span-2"
                htmlFor={fields.email}
              >
                <input
                  id={fields.email}
                  type="email"
                  value={form.email}
                  onChange={(event) => atualizar('email', event.target.value)}
                  className="input-propriedade"
                  placeholder="Ex.: joao@valesafra.com"
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>

              <Field
                label="Senha inicial"
                required
                error={errors.senha}
                htmlFor={fields.senha}
              >
                <input
                  id={fields.senha}
                  type="password"
                  value={form.senha}
                  onChange={(event) => atualizar('senha', event.target.value)}
                  className="input-propriedade"
                  placeholder="Mínimo de 8 caracteres"
                  aria-invalid={Boolean(errors.senha)}
                />
              </Field>

              <Field
                label="Perfil de Acesso"
                required
                error={errors.perfil}
                htmlFor={fields.perfil}
              >
                <select
                  id={fields.perfil}
                  value={form.perfil}
                  onChange={(event) => atualizar('perfil', event.target.value)}
                  className="input-propriedade"
                  aria-invalid={Boolean(errors.perfil)}
                >
                  <option value="PRODUTOR">Produtor (Escopo Próprio)</option>
                  <option value="TECNICO">Técnico (Restrito)</option>
                  <option value="ADMIN">Admin (Acesso Total)</option>
                </select>
              </Field>
            </div>
          </section>
        </div>

        {/* Resumo lateral */}
        <aside className="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
          <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
              Resumo do cadastro
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#6a776f]">
              Confira os dados antes de registrar o usuário.
            </p>

            <div className="mt-5 space-y-4">
              <SummaryItem label="Nome" value={form.nome || 'Não informado'} />
              <SummaryItem label="E-mail" value={form.email || 'Não informado'} />
              <SummaryItem label="Perfil" value={form.perfil} />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#edf1ee] pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7a867f]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#25332b]">{value}</p>
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
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-[#334139]">
        {label}
        {required ? <span className="ml-1 text-[#009B4D]" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}