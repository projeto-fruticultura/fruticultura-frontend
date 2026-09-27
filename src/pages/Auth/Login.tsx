import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthField } from '@/components/auth/AuthField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'

interface LocationState {
  sucesso?: string
}

export default function Login() {
  const { entrar, usuario, carregando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const sucesso = (location.state as LocationState | null)?.sucesso

  if (!carregando && usuario) return <Navigate to="/propriedades" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro('')

    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha para continuar.')
      return
    }

    setEnviando(true)
    try {
      await entrar(email.trim(), senha)
      navigate('/propriedades', { replace: true })
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#009B4D]">Acesso à plataforma</p>
        <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-[#14212b]">Entrar no ValeSafra</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#5f6b75]">Use suas credenciais para acessar a gestão das propriedades e os recursos disponíveis.</p>
      </div>

      <div className="space-y-4">
        {sucesso ? <FeedbackMessage variant="success">{sucesso}</FeedbackMessage> : null}
        {erro ? <FeedbackMessage variant="error">{erro}</FeedbackMessage> : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <AuthField
          id="login-email"
          label="E-mail"
          type="email"
          placeholder="nome@exemplo.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <AuthField
          id="login-senha"
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          required
        />

        <div className="flex justify-end">
          <Link
            to="/esqueci-senha"
            className="rounded-md text-sm font-semibold text-[#15693E] underline-offset-4 transition hover:text-[#009B4D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="flex h-13 w-full items-center justify-center rounded-xl bg-[#009B4D] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,0.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#69747e]">
        Ainda não tem uma conta?{' '}
        <Link
          to="/cadastro"
          className="rounded-md font-semibold text-[#15693E] underline-offset-4 transition hover:text-[#009B4D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}
