import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'

// Nao existe cadastro publico: so um ADMIN logado cria usuarios (POST /usuarios exige token de ADMIN).
// Por isso esta tela so explica como pedir acesso, sem formulario.
export default function Cadastro() {
  return (
    <AuthLayout>
      <div className="mb-7">
        <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-[#14212b]">Como solicitar acesso</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#5f6b75]">
          O ValeSafra não tem cadastro aberto ao público. As contas são criadas por um administrador da plataforma.
        </p>
      </div>

      <FeedbackMessage variant="info">
        Peça ao administrador para criar o seu acesso. Depois, entre com o e-mail e a senha que ele informar.
      </FeedbackMessage>

      <Link
        to="/login"
        className="mt-6 flex h-13 w-full items-center justify-center rounded-xl bg-[#009B4D] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,0.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/25"
      >
        Voltar para o login
      </Link>
    </AuthLayout>
  )
}
