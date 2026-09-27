import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthField } from '@/components/auth/AuthField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { authService } from '@/services/authService'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro('')
    setMensagem('')

    if (!email.trim()) {
      setErro('Informe o e-mail cadastrado.')
      return
    }

    setEnviando(true)
    try {
      const resposta = await authService.solicitarRedefinicao(email.trim())
      setMensagem(resposta.mensagem)
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível enviar a solicitação.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
      >
        <ArrowLeft size={17} aria-hidden="true" /> Voltar para o login
      </Link>

      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#009B4D]">Recuperação de acesso</p>
        <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-[#14212b]">Esqueceu sua senha?</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#5f6b75]">Informe o e-mail cadastrado. Se a conta estiver disponível, você receberá as instruções para criar uma nova senha.</p>
      </div>

      <div className="space-y-4">
        {mensagem ? <FeedbackMessage variant="success">{mensagem}</FeedbackMessage> : null}
        {erro ? <FeedbackMessage variant="error">{erro}</FeedbackMessage> : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <AuthField
          id="recuperacao-email"
          label="E-mail"
          type="email"
          placeholder="nome@exemplo.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <button
          type="submit"
          disabled={enviando}
          className="flex h-13 w-full items-center justify-center rounded-xl bg-[#009B4D] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,0.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Enviando...' : 'Enviar instruções'}
        </button>
      </form>
    </AuthLayout>
  )
}
