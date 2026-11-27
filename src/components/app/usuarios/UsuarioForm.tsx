import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

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
  cancelTo?: string
  onSubmit: (payload: UsuarioPayload) => Promise<void>
}

interface UsuarioFormValores {
  nome: string
  email: string
  senha: string
  perfil: string
}

const INFO_PERFIL: Record<
  string,
  {
    rotulo: string
    escopo: string
    badgeClass: string
  }
> = {
  PRODUTOR: {
    rotulo: 'Produtor',
    escopo:
      'Gerencia propriedades, lotes, sensores, cotações e fretes vinculados à própria operação.',
    badgeClass: 'bg-[#edf7f1] text-[#15693E] border-[#cce5d6]',
  },
  TECNICO: {
    rotulo: 'Técnico',
    escopo:
      'Acesso restrito para acompanhamento de diagnósticos, leituras e condições climáticas.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
  },
  ADMIN: {
    rotulo: 'Administrador',
    escopo:
      'Acesso total à governança da plataforma, propriedades cadastradas e gestão de usuários.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
}

function valoresIniciais(
  initialValues?: UsuarioFormInitialValues,
): UsuarioFormValores {
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
  cancelTo = '/usuarios',
  onSubmit,
}: UsuarioFormProps) {
  const formId = useId()

  const [form, setForm] = useState<UsuarioFormValores>(() =>
    valoresIniciais(initialValues),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [saving, setSaving] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

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
      next.email =
        'Informe um formato de e-mail válido (ex.: nome@dominio.com).'
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

  const perfilInfo = INFO_PERFIL[form.perfil] ?? {
    rotulo: form.perfil || 'Não definido',
    escopo: 'Selecione um perfil para visualizar as permissões aplicadas.',
    badgeClass: 'bg-[#f2f5f3] text-[#5c6b63] border-[#dce5df]',
  }

  const iniciais = obterIniciais(form.nome)
  const senhaValida = form.senha.length >= 8

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError ? (
        <div className="mb-5">
          <FeedbackMessage variant="error">{generalError}</FeedbackMessage>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        {/* Coluna esquerda: formulário estruturado */}
        <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-6">
            <div className="border-b border-[#edf2ee] pb-5">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                Dados do usuário
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#68756d]">
                Informe os dados de identificação, a senha inicial e o nível de
                acesso na plataforma.
              </p>
            </div>

            {/* Grupo 1: Identificação pessoal */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Identificação pessoal
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome completo"
                  required
                  error={errors.nome}
                  className="sm:col-span-2"
                  htmlFor={fields.nome}
                >
                  <input
                    id={fields.nome}
                    type="text"
                    value={form.nome}
                    onChange={(event) => atualizar('nome', event.target.value)}
                    className={inputClass(Boolean(errors.nome))}
                    placeholder="Ex.: João da Silva"
                    aria-invalid={Boolean(errors.nome)}
                    aria-describedby={
                      errors.nome ? `${fields.nome}-error` : undefined
                    }
                  />
                </Field>

                <Field
                  label="E-mail de acesso"
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
                    className={inputClass(Boolean(errors.email))}
                    placeholder="Ex.: joao@valesafra.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? `${fields.email}-error` : undefined
                    }
                  />
                </Field>
              </div>
            </div>

            {/* Grupo 2: Credenciais e permissão */}
            <div className="space-y-4 border-t border-[#edf2ee] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Credenciais e permissão de acesso
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Senha inicial"
                  required
                  error={errors.senha}
                  htmlFor={fields.senha}
                >
                  <div className="relative">
                    <input
                      id={fields.senha}
                      type={mostrarSenha ? 'text' : 'password'}
                      value={form.senha}
                      onChange={(event) =>
                        atualizar('senha', event.target.value)
                      }
                      className={`${inputClass(Boolean(errors.senha))} pr-12`}
                      placeholder="Mínimo de 8 caracteres"
                      aria-invalid={Boolean(errors.senha)}
                      aria-describedby={
                        errors.senha ? `${fields.senha}-error` : undefined
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenha((atual) => !atual)}
                      className="absolute inset-y-2 right-2 flex w-9 cursor-pointer items-center justify-center rounded-lg text-[#68756d] transition hover:bg-[#f0f5f2] hover:text-[#18251e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                      aria-label={
                        mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                      }
                      title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-controls={fields.senha}
                    >
                      {mostrarSenha ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field
                  label="Perfil de acesso"
                  required
                  error={errors.perfil}
                  htmlFor={fields.perfil}
                >
                  <select
                    id={fields.perfil}
                    value={form.perfil}
                    onChange={(event) =>
                      atualizar('perfil', event.target.value)
                    }
                    className={inputClass(Boolean(errors.perfil))}
                    aria-invalid={Boolean(errors.perfil)}
                    aria-describedby={
                      errors.perfil ? `${fields.perfil}-error` : undefined
                    }
                  >
                    <option value="PRODUTOR">Produtor (Escopo Próprio)</option>
                    <option value="TECNICO">Técnico (Restrito)</option>
                    <option value="ADMIN">Admin (Acesso Total)</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna direita: credencial de acesso + ações */}
        <aside>
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                Credencial de acesso
              </p>

              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${perfilInfo.badgeClass}`}
              >
                {perfilInfo.rotulo}
              </span>
            </div>

            {/* Cartão de identidade do usuário */}
            <div className="mt-4 rounded-2xl border border-[#dce6e0] bg-gradient-to-br from-[#f7faf8] to-[#eef5f0] p-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cce5d6] bg-white text-sm font-bold tracking-tight text-[#15693E]"
                  aria-hidden="true"
                >
                  {iniciais}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-[#18251e]">
                    {form.nome.trim() || 'Novo usuário'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#68756d]">
                    {form.email.trim().toLowerCase() || 'E-mail não informado'}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 border-t border-[#e1eae4] pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#68756d]">
                  Escopo de permissão
                </p>
                <p className="mt-1 text-xs leading-5 text-[#33443a]">
                  {perfilInfo.escopo}
                </p>
              </div>
            </div>

            {/* Indicador de requisito de senha */}
            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#e6ede9] bg-[#f8faf9] px-3.5 py-2.5 text-xs">
              <span className="text-[#68756d]">Senha inicial</span>
              <span
                className={`font-semibold ${
                  senhaValida ? 'text-[#15693E]' : 'text-[#7a8980]'
                }`}
              >
                {senhaValida
                  ? 'Requisitos atendidos (8+ caracteres)'
                  : `${form.senha.length}/8 caracteres`}
              </span>
            </div>

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
                disabled={saving}
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

function obterIniciais(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (partes.length === 0) return 'VS'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
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
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}