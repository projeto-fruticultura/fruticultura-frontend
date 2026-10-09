import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'

// O backend ainda nao tem recuperacao de senha por e-mail (nao existem /auth/esqueci-senha nem /auth/redefinir-senha).
// Ate existir, esta tela so orienta, sem formulario e sem chamar a API.
export default function EsqueciSenha() {
  return (
    <AuthLayout>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
      >
        <ArrowLeft size={17} aria-hidden="true" /> Voltar para o login
      </Link>

      <div className="mb-7">
        <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-[#14212b]">Esqueceu sua senha?</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#5f6b75]">A recuperação de senha por e-mail ainda não está disponível.</p>
      </div>

      <FeedbackMessage variant="info">
        Peça ao administrador para redefinir a sua senha.
      </FeedbackMessage>
    </AuthLayout>
  )
}
