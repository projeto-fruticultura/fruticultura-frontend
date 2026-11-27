import { useNavigate } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import {
  UsuarioForm,
  type UsuarioPayload,
} from '@/components/app/usuarios/UsuarioForm'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { usuarioService } from '@/services/usuarioService'

export default function NovoUsuario() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const isAdmin = usuario?.perfil === 'ADMIN'

  async function handleSubmit(payload: UsuarioPayload) {
    await usuarioService.criar(payload)
    navigate('/usuarios', { replace: true })
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

  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Usuários', to: '/usuarios' },
            { label: 'Novo usuário' },
          ]}
        />

        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Adicionar novo usuário
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Cadastre um novo produtor, técnico ou administrador e defina seu
              nível de acesso na plataforma.
            </p>
          </div>
        </section>

        <UsuarioForm submitLabel="Cadastrar usuário" onSubmit={handleSubmit} />
      </div>
    </AppShell>
  )
}