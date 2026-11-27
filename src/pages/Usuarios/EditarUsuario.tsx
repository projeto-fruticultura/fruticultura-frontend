import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { usuarioService } from '@/services/usuarioService'
import type { Usuario } from '@/types/api'

type DadosEdicao = Pick<Usuario, 'nome' | 'email'>

const INFO_PERFIL: Record<
  Usuario['perfil'],
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

export default function EditarUsuario() {
  const { id: parametroId } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const isAdmin = usuario?.perfil === 'ADMIN'

  const id = Number(parametroId)
  const idValido =
    !!parametroId &&
    Number.isInteger(id) &&
    id > 0 &&
    id <= 2147483647

  const [usuarioEditado, setUsuarioEditado] = useState<Usuario | null>(null)
  const [dados, setDados] = useState<DadosEdicao>({ nome: '', email: '' })
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')

  const [errosCampos, setErrosCampos] = useState<{
    nome?: string
    email?: string
  }>({})
  const [erroSalvar, setErroSalvar] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  const [dadosPendentes, setDadosPendentes] = useState<DadosEdicao | null>(null)
  const [salvando, setSalvando] = useState(false)
  const operacaoEmAndamento = useRef(false)

  useEffect(() => {
    if (!isAdmin || !idValido) return

    let ativo = true

    void usuarioService
      .listar()
      .then((lista) => {
        if (!ativo) return

        const encontrado = lista.find((item) => item.id === id)

        if (!encontrado) {
          setErroCarregamento('Usuário não encontrado.')
          return
        }

        setUsuarioEditado(encontrado)
        setDados({
          nome: encontrado.nome,
          email: encontrado.email,
        })
      })
      .catch((error) => {
        if (!ativo) return

        setErroCarregamento(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os dados do usuário.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [isAdmin, id, idValido])

  function atualizarCampo(campo: keyof DadosEdicao, valor: string) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }))
    setErrosCampos((anterior) => ({ ...anterior, [campo]: undefined }))
    setErroSalvar('')
    setMensagemSucesso('')
  }

  function solicitarConfirmacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!usuarioEditado || salvando || operacaoEmAndamento.current) return

    setErroSalvar('')
    setMensagemSucesso('')

    const nome = dados.nome.trim()
    const email = dados.email.trim().toLowerCase()
    const novosErros: { nome?: string; email?: string } = {}

    if (!nome) {
      novosErros.nome = 'O nome é obrigatório.'
    } else if (nome.length > 150) {
      novosErros.nome = 'O nome deve ter no máximo 150 caracteres.'
    }

    if (!email) {
      novosErros.email = 'O e-mail é obrigatório.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      novosErros.email = 'Informe um e-mail válido.'
    }

    setErrosCampos(novosErros)

    if (Object.keys(novosErros).length > 0) return

    if (nome === usuarioEditado.nome && email === usuarioEditado.email) {
      setMensagemSucesso('Nenhuma alteração foi identificada.')
      return
    }

    setDadosPendentes({ nome, email })
  }

  async function confirmarAtualizacao() {
    if (
      !dadosPendentes ||
      !usuarioEditado ||
      !isAdmin ||
      operacaoEmAndamento.current
    ) {
      return
    }

    operacaoEmAndamento.current = true
    setSalvando(true)
    setErroSalvar('')

    try {
      const usuarioAtualizado = await usuarioService.atualizar(
        usuarioEditado.id,
        dadosPendentes,
      )

      setUsuarioEditado(usuarioAtualizado)
      setDados({
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
      })

      setErrosCampos({})
      setDadosPendentes(null)
      setMensagemSucesso('Informações do usuário atualizadas com sucesso.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErroSalvar(error.message)
        setErrosCampos({
          nome: error.campos?.nome,
          email: error.campos?.email,
        })
      } else {
        setErroSalvar('Não foi possível atualizar o usuário. Tente novamente.')
      }

      setDadosPendentes(null)
    } finally {
      operacaoEmAndamento.current = false
      setSalvando(false)
    }
  }

  if (!isAdmin) {
    return (
      <AppShell section="usuarios">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="error">
              Acesso restrito. Esta área é exclusiva para administradores.
            </FeedbackMessage>
          </div>
        </div>
      </AppShell>
    )
  }

  const perfilInfo = usuarioEditado
    ? INFO_PERFIL[usuarioEditado.perfil]
    : null
  const iniciais = obterIniciais(dados.nome)
  const contaAtiva = usuarioEditado?.status === 'ATIVO'

  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Usuários', to: '/usuarios' },
            { label: 'Editar usuário' },
          ]}
        />

        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Editar usuário
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Atualize o nome e o e-mail de acesso. O perfil e a situação da
              conta estão disponíveis para consulta.
            </p>
          </div>
        </section>

        {!idValido ? (
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="error">
              Identificador de usuário inválido.
            </FeedbackMessage>
          </div>
        ) : carregando ? (
          <div
            className="grid min-h-[260px] place-items-center rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
              <p className="mt-3.5 text-sm text-[#68756d]">
                Carregando informações do usuário...
              </p>
            </div>
          </div>
        ) : erroCarregamento ? (
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="error">
              {erroCarregamento}
            </FeedbackMessage>
          </div>
        ) : usuarioEditado && perfilInfo ? (
          <>
            {mensagemSucesso ? (
              <div className="mb-5">
                <FeedbackMessage variant="success">
                  {mensagemSucesso}
                </FeedbackMessage>
              </div>
            ) : null}

            {erroSalvar ? (
              <div className="mb-5">
                <FeedbackMessage variant="error">{erroSalvar}</FeedbackMessage>
              </div>
            ) : null}

            <form
              onSubmit={solicitarConfirmacao}
              noValidate
              className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]"
            >
              {/* Coluna esquerda: formulário estruturado */}
              <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
                <div className="space-y-6">
                  <div className="border-b border-[#edf2ee] pb-5">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                      Dados do usuário
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#68756d]">
                      Revise os dados cadastrais utilizados para identificação e
                      autenticação.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                      Identificação e contato
                    </p>

                    <div className="grid gap-4">
                      <Field
                        label="Nome completo"
                        required
                        error={errosCampos.nome}
                        htmlFor="editar-usuario-nome"
                      >
                        <input
                          id="editar-usuario-nome"
                          type="text"
                          value={dados.nome}
                          maxLength={150}
                          disabled={salvando}
                          placeholder="Ex.: João da Silva"
                          aria-invalid={Boolean(errosCampos.nome)}
                          aria-describedby={
                            errosCampos.nome
                              ? 'editar-usuario-nome-error'
                              : undefined
                          }
                          onChange={(event) =>
                            atualizarCampo('nome', event.target.value)
                          }
                          className={`${inputClass(Boolean(errosCampos.nome))} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                        />
                      </Field>

                      <Field
                        label="E-mail de acesso"
                        required
                        error={errosCampos.email}
                        htmlFor="editar-usuario-email"
                      >
                        <input
                          id="editar-usuario-email"
                          type="email"
                          value={dados.email}
                          disabled={salvando}
                          placeholder="Ex.: joao@valesafra.com"
                          aria-invalid={Boolean(errosCampos.email)}
                          aria-describedby={
                            errosCampos.email
                              ? 'editar-usuario-email-error'
                              : undefined
                          }
                          onChange={(event) =>
                            atualizarCampo('email', event.target.value)
                          }
                          className={`${inputClass(Boolean(errosCampos.email))} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                        />
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
                          {dados.nome.trim() || 'Nome não informado'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#68756d]">
                          {dados.email.trim().toLowerCase() ||
                            'E-mail não informado'}
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

                  {/* Status da conta */}
                  <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[#e6ede9] bg-[#f8faf9] px-3.5 py-2.5 text-xs">
                    <span className="text-[#68756d]">Situação da conta</span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${
                        contaAtiva
                          ? 'bg-[#edf7f1] text-[#15693E]'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          contaAtiva ? 'bg-[#009B4D]' : 'bg-red-600'
                        }`}
                        aria-hidden="true"
                      />
                      {contaAtiva ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <p className="mt-3.5 text-xs leading-5 text-[#68756d]">
                    A senha não é exibida nesta tela. Sua redefinição é
                    realizada em uma rotina administrativa separada.
                  </p>

                  {/* Barra de ações */}
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#edf2ee] pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                      to="/usuarios"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                    >
                      Cancelar
                    </Link>

                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#009B4D] px-7 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </section>
              </aside>
            </form>

            <AlertDialog.Root
              open={dadosPendentes !== null}
              onOpenChange={(aberto) => {
                if (!aberto && !operacaoEmAndamento.current) {
                  setDadosPendentes(null)
                }
              }}
            >
              <AlertDialog.Portal>
                <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />

                <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-2xl sm:p-7">
                  <AlertDialog.Title className="text-xl font-semibold tracking-[-0.02em] text-[#18251e]">
                    Confirmar edição
                  </AlertDialog.Title>

                  <AlertDialog.Description className="mt-2.5 text-sm leading-6 text-[#68756d]">
                    Deseja salvar as alterações cadastrais de{' '}
                    <span className="font-semibold text-[#18251e]">
                      {usuarioEditado.nome}
                    </span>
                    ?
                  </AlertDialog.Description>

                  {dadosPendentes ? (
                    <dl className="mt-4 divide-y divide-[#edf2ee] rounded-2xl border border-[#e6ede9] bg-[#f8faf9] px-4 text-xs">
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="text-[#68756d]">Nome</dt>
                        <dd className="truncate font-semibold text-[#18251e]">
                          {dadosPendentes.nome}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-2.5">
                        <dt className="text-[#68756d]">E-mail</dt>
                        <dd className="truncate font-semibold text-[#18251e]">
                          {dadosPendentes.email}
                        </dd>
                      </div>
                    </dl>
                  ) : null}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => setDadosPendentes(null)}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#d8e3dc] bg-white px-5 text-sm font-semibold text-[#48574e] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={salvando || !dadosPendentes}
                      onClick={() => void confirmarAtualizacao()}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#009B4D] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvando ? 'Salvando...' : 'Confirmar'}
                    </button>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </>
        ) : (
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <FeedbackMessage variant="error">
              Não foi possível localizar o usuário.
            </FeedbackMessage>
          </div>
        )}
      </div>
    </AppShell>
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