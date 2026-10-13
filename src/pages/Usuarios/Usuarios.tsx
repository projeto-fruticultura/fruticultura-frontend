
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Pencil, Plus, UserCheck, Users, UserX } from 'lucide-react'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { usuarioService } from '@/services/usuarioService'
import type { Usuario } from '@/types/api'

export default function Usuarios() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.perfil === 'ADMIN'

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Controle das ações administrativas.
  const [acaoPendente, setAcaoPendente] = useState<Usuario | null>(null)
  const [processando, setProcessando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [listaDesatualizada, setListaDesatualizada] = useState(false)

  // Impede solicitações duplicadas antes da atualização do estado React.
  const operacaoEmAndamento = useRef(false)

  useEffect(() => {
    if (!isAdmin) return

    let ativo = true

    async function carregar() {
      try {
        const lista = await usuarioService.listar()

        if (!ativo) return

        setUsuarios(lista)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar os usuários.',
          )
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    void carregar()

    return () => {
      ativo = false
    }
  }, [isAdmin])

  function solicitarAlteracaoStatus(u: Usuario) {
    if (
      !isAdmin ||
      operacaoEmAndamento.current ||
      listaDesatualizada
    ) {
      return
    }

    // O administrador não pode inativar a própria conta.
    if (u.id === usuario?.id && u.status === 'ATIVO') {
      setErroAcao('Você não pode inativar a sua própria conta.')
      return
    }

    setMensagemSucesso('')
    setErroAcao('')
    setAcaoPendente(u)
  }

  async function confirmarAlteracaoStatus() {
    if (
      !acaoPendente ||
      !isAdmin ||
      operacaoEmAndamento.current ||
      listaDesatualizada
    ) {
      return
    }

    const alvo = acaoPendente
    const inativando = alvo.status === 'ATIVO'

    // Proteção adicional contra autoinativação.
    if (inativando && alvo.id === usuario?.id) {
      setErroAcao('Você não pode inativar a sua própria conta.')
      setAcaoPendente(null)
      return
    }

    operacaoEmAndamento.current = true
    setProcessando(true)
    setMensagemSucesso('')
    setErroAcao('')

    try {
      if (inativando) {
        await usuarioService.inativar(alvo.id)
      } else {
        await usuarioService.reativar(alvo.id)
      }

      const novoStatus: Usuario['status'] = inativando
        ? 'INATIVO'
        : 'ATIVO'

      // Atualiza imediatamente o usuário alterado na listagem.
      setUsuarios((listaAtual) =>
        listaAtual.map((u) =>
          u.id === alvo.id
            ? { ...u, status: novoStatus }
            : u,
        ),
      )

      setAcaoPendente(null)

      setMensagemSucesso(
        `Usuário "${alvo.nome}" ${
          inativando ? 'inativado' : 'reativado'
        } com sucesso.`,
      )

      // Sincroniza novamente com a fonte oficial: o backend.
      try {
        const listaAtualizada = await usuarioService.listar()
        setUsuarios(listaAtualizada)
      } catch {
        // Preserva o novo status local e bloqueia novas ações
        // até que a página seja recarregada com dados atualizados.
        setListaDesatualizada(true)
        setErroAcao(
          'O status foi alterado com sucesso, mas não foi possível sincronizar a listagem. Recarregue a página antes de realizar outra ação.',
        )
      }
    } catch (error) {
      setErroAcao(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível alterar o status do usuário.',
      )

      setAcaoPendente(null)
    } finally {
      operacaoEmAndamento.current = false
      setProcessando(false)
    }
  }

  if (!isAdmin) {
    return (
      <AppShell section="usuarios">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8">
          <FeedbackMessage variant="error">
            Acesso restrito. Esta área é exclusiva para administradores.
          </FeedbackMessage>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Gestão de Usuários
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie os acessos de administradores, produtores e técnicos.
              </p>
            </div>

            <Link
              to="/usuarios/novo"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar usuário
            </Link>
          </div>
        </section>

        {/* Listagem */}
        <section className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="border-b border-[#edf1ee] pb-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
              Usuários cadastrados
            </h2>

            {!carregando && !erro ? (
              <p className="mt-1 text-sm text-[#718078]">
                {usuarios.length}{' '}
                {usuarios.length === 1
                  ? 'usuário cadastrado'
                  : 'usuários cadastrados'}
              </p>
            ) : null}
          </div>

          {/* Mensagens de feedback */}
          {mensagemSucesso && (
            <div className="mt-5">
              <FeedbackMessage variant="success">
                {mensagemSucesso}
              </FeedbackMessage>
            </div>
          )}

          {erroAcao && (
            <div className="mt-5">
              <FeedbackMessage variant="error">
                {erroAcao}
              </FeedbackMessage>
            </div>
          )}

          {/* Estados da listagem */}
          {carregando ? (
            <p className="mt-5 text-sm text-[#68756d]">
              Carregando usuários...
            </p>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">
                {erro}
              </FeedbackMessage>
            </div>
          ) : usuarios.length === 0 ? (
            <p className="mt-5 text-sm text-[#68756d]">
              Nenhum usuário cadastrado além de você.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {usuarios.map((u) => {
                const podeInativarPropriaConta =
                  u.id === usuario?.id && u.status === 'ATIVO'

                const botaoDesabilitado =
                  processando ||
                  listaDesatualizada ||
                  podeInativarPropriaConta

                return (
                  <article
                    key={u.id}
                    className="rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Informações do usuário */}
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                          <Users size={21} aria-hidden="true" />
                        </span>

                        <div className="min-w-0">
                          <h3 className="break-words text-base font-semibold text-[#202d25] sm:text-lg">
                            {u.nome}
                          </h3>

                          <p className="mt-1 break-all text-sm text-[#66746c]">
                            {u.email}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-semibold text-[#15693E]">
                              Perfil: {u.perfil}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                u.status === 'ATIVO'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {u.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações administrativas */}
                      <div className="flex flex-wrap items-center justify-end gap-2 lg:self-center">
                        {/* Editar usuário */}
                        <Link
                          to={`/usuarios/${u.id}/editar`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9e2db] bg-white px-4 text-sm font-semibold text-[#334139] transition hover:border-[#009B4D] hover:bg-[#f0faf4] hover:text-[#15693E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
                        >
                          <Pencil size={16} aria-hidden="true" />
                          Editar
                        </Link>

                        {/* Inativar ou reativar */}
                        <Button
                          type="button"
                          variant={
                            u.status === 'ATIVO'
                              ? 'destructive'
                              : 'outline'
                          }
                          size="lg"
                          className="min-w-28"
                          disabled={botaoDesabilitado}
                          title={
                            podeInativarPropriaConta
                              ? 'Você não pode inativar sua própria conta'
                              : listaDesatualizada
                                ? 'Recarregue a página para atualizar a lista'
                                : undefined
                          }
                          onClick={() => solicitarAlteracaoStatus(u)}
                        >
                          {u.status === 'ATIVO' ? (
                            <>
                              <UserX size={16} aria-hidden="true" />
                              Inativar
                            </>
                          ) : (
                            <>
                              <UserCheck size={16} aria-hidden="true" />
                              Reativar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de confirmação de status */}
      <AlertDialog.Root
        open={acaoPendente !== null}
        onOpenChange={(aberto) => {
          if (!aberto && !operacaoEmAndamento.current) {
            setAcaoPendente(null)
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop
            className="fixed inset-0 z-50 bg-black/50"
          />

          <AlertDialog.Popup
            className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl"
          >
            <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
              Confirmar{' '}
              {acaoPendente?.status === 'ATIVO'
                ? 'inativação'
                : 'reativação'}
            </AlertDialog.Title>

            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
              Deseja realmente{' '}
              {acaoPendente?.status === 'ATIVO'
                ? 'inativar'
                : 'reativar'}{' '}
              o usuário "{acaoPendente?.nome}"?
              {acaoPendente?.status === 'ATIVO'
                ? ' O acesso à plataforma será bloqueado até a reativação.'
                : ' O usuário poderá acessar novamente a plataforma com suas credenciais.'}
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={processando}
                onClick={() => setAcaoPendente(null)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant={
                  acaoPendente?.status === 'ATIVO'
                    ? 'destructive'
                    : 'default'
                }
                size="lg"
                disabled={processando || !acaoPendente}
                onClick={() => void confirmarAlteracaoStatus()}
              >
                {processando ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </AppShell>
  )
}
