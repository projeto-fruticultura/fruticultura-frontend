import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { ArrowLeft, Save, ShieldCheck, Sprout, UserPen, Wrench } from 'lucide-react'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { usuarioService } from '@/services/usuarioService'
import type { Usuario } from '@/types/api'

type DadosEdicao = Pick<Usuario, 'nome' | 'email'>

function renderBadgePerfil(perfil: Usuario['perfil']) {
  if (perfil === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        <ShieldCheck size={14} aria-hidden="true" />
        ADMIN
      </span>
    )
  }

  if (perfil === 'TECNICO') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
        <Wrench size={14} aria-hidden="true" />
        TÉCNICO
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#edf7f1] px-3 py-1 text-xs font-semibold text-[#15693E]">
      <Sprout size={14} aria-hidden="true" />
      PRODUTOR
    </span>
  )
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
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
          <FeedbackMessage variant="error">
            Acesso restrito. Esta área é exclusiva para administradores.
          </FeedbackMessage>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Usuários', to: '/usuarios' },
            { label: 'Editar usuário' },
          ]}
        />

        <Link
          to="/usuarios"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para usuários
        </Link>

        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <UserPen size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Editar usuário
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Atualize o nome e o e-mail. O perfil e o status estão
                  disponíveis para consulta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {!idValido ? (
          <div className="mt-6">
            <FeedbackMessage variant="error">
              Identificador de usuário inválido.
            </FeedbackMessage>
          </div>
        ) : carregando ? (
          <p className="mt-6 text-sm text-[#68756d]">
            Carregando informações do usuário...
          </p>
        ) : erroCarregamento ? (
          <div className="mt-6">
            <FeedbackMessage variant="error">
              {erroCarregamento}
            </FeedbackMessage>
          </div>
        ) : usuarioEditado ? (
          <>
            <div className="mb-6 space-y-3">
              {mensagemSucesso && (
                <FeedbackMessage variant="success">
                  {mensagemSucesso}
                </FeedbackMessage>
              )}

              {erroSalvar && (
                <FeedbackMessage variant="error">
                  {erroSalvar}
                </FeedbackMessage>
              )}
            </div>

            <form
              onSubmit={solicitarConfirmacao}
              noValidate
              className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.7fr)]"
            >
              <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold text-[#1c2922]">
                  Dados do usuário
                </h2>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="editar-usuario-nome"
                      className="mb-2 block text-sm font-semibold text-[#334139]"
                    >
                      Nome completo
                    </label>

                    <input
                      id="editar-usuario-nome"
                      className="input-propriedade"
                      value={dados.nome}
                      maxLength={150}
                      disabled={salvando}
                      aria-invalid={Boolean(errosCampos.nome)}
                      onChange={(event) =>
                        atualizarCampo('nome', event.target.value)
                      }
                    />

                    {errosCampos.nome && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errosCampos.nome}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="editar-usuario-email"
                      className="mb-2 block text-sm font-semibold text-[#334139]"
                    >
                      E-mail
                    </label>

                    <input
                      id="editar-usuario-email"
                      type="email"
                      className="input-propriedade"
                      value={dados.email}
                      disabled={salvando}
                      aria-invalid={Boolean(errosCampos.email)}
                      onChange={(event) =>
                        atualizarCampo('email', event.target.value)
                      }
                    />

                    {errosCampos.email && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errosCampos.email}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <aside className="space-y-5 xl:self-start">
                <section className="rounded-2xl border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-[#1c2922]">
                    Informações de acesso
                  </h2>

                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <p className="mb-1.5 font-semibold text-[#68756d]">
                        Perfil
                      </p>
                      {renderBadgePerfil(usuarioEditado.perfil)}
                    </div>

                    <div>
                      <p className="mb-1.5 font-semibold text-[#68756d]">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          usuarioEditado.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            usuarioEditado.status === 'ATIVO'
                              ? 'bg-emerald-600'
                              : 'bg-red-600'
                          }`}
                        />
                        {usuarioEditado.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 border-t border-[#edf1ee] pt-4 text-xs leading-5 text-[#68756d]">
                    A senha não é exibida. Sua redefinição será tratada em uma
                    funcionalidade administrativa separada.
                  </p>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    to="/usuarios"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e2db] bg-white px-5 text-sm font-semibold text-[#334139] transition hover:bg-[#f5f8f6]"
                  >
                    Cancelar
                  </Link>

                  <Button type="submit" size="lg" disabled={salvando}>
                    <Save size={17} aria-hidden="true" />
                    Salvar alterações
                  </Button>
                </div>
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
                <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

                <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
                  <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
                    Confirmar edição
                  </AlertDialog.Title>

                  <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
                    Deseja salvar as alterações do usuário
                    {' "'}{usuarioEditado.nome}"?
                  </AlertDialog.Description>

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={salvando}
                      onClick={() => setDadosPendentes(null)}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="button"
                      size="lg"
                      disabled={salvando || !dadosPendentes}
                      onClick={() => void confirmarAtualizacao()}
                    >
                      {salvando ? 'Salvando...' : 'Confirmar'}
                    </Button>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </>
        ) : (
          <div className="mt-6">
            <FeedbackMessage variant="error">
              Não foi possível localizar o usuário.
            </FeedbackMessage>
          </div>
        )}
      </div>
    </AppShell>
  )
}