import { Users, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
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

  useEffect(() => {
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
        if (ativo) setCarregando(false)
      }
    }

    if (isAdmin) {
      carregar()
    } else {
      setCarregando(false)
    }

    return () => {
      ativo = false
    }
  }, [isAdmin])

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

        <section className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="border-b border-[#edf1ee] pb-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]">
              Usuários cadastrados
            </h2>
            {!carregando && !erro ? (
              <p className="mt-1 text-sm text-[#718078]">
                {usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </p>
            ) : null}
          </div>

          {carregando ? (
            <p className="mt-5 text-sm text-[#68756d]">Carregando usuários...</p>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : usuarios.length === 0 ? (
            <p className="mt-5 text-sm text-[#68756d]">Nenhum usuário cadastrado além de você.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {usuarios.map((u) => (
                <article
                  key={u.id}
                  className="rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                        <Users size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-[#202d25] sm:text-lg">
                          {u.nome}
                        </h3>
                        <p className="mt-1 text-sm text-[#66746c]">{u.email}</p>
                        
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}