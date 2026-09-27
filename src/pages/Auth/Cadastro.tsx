import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField } from '@/components/auth/AuthField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { authService } from '@/services/authService'

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erroGeral, setErroGeral] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErroGeral('')
    setErros({})

    const novosErros: Record<string, string> = {}
    if (nome.trim().length < 2) novosErros.nome = 'Informe seu nome.'
    if (!email.trim()) novosErros.email = 'Informe seu e-mail.'
    if (senha.length < 8) novosErros.senha = 'Use pelo menos 8 caracteres.'
    if (senha !== confirmacao) novosErros.confirmacao = 'As senhas não coincidem.'

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setEnviando(true)
    try {
      await authService.cadastrar(nome.trim(), email.trim(), senha)
      navigate('/login', {
        replace: true,
        state: { sucesso: 'Cadastro realizado com sucesso. Entre com seu e-mail e senha.' },
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setErroGeral(error.message)
        if (error.campos) setErros(error.campos)
      } else {
        setErroGeral('Não foi possível concluir o cadastro.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#009B4D]">Novo acesso</p>
        <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-[#14212b]">Criar conta</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#5f6b75]">Cadastre-se como produtor para começar a utilizar os recursos disponíveis no ValeSafra.</p>
      </div>

      {erroGeral ? <FeedbackMessage variant="error">{erroGeral}</FeedbackMessage> : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <AuthField
          id="cadastro-nome"
          label="Nome completo"
          placeholder="Seu nome completo"
          autoComplete="name"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          erro={erros.nome}
          required
        />
        <AuthField
          id="cadastro-email"
          label="E-mail"
          type="email"
          placeholder="nome@exemplo.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          erro={erros.email}
          required
        />
        <AuthField
          id="cadastro-senha"
          label="Senha"
          type="password"
          placeholder="Crie uma senha"
          autoComplete="new-password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          erro={erros.senha}
          hint="Use pelo menos 8 caracteres."
          required
        />
        <AuthField
          id="cadastro-confirmacao"
          label="Confirmar senha"
          type="password"
          placeholder="Digite a senha novamente"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          erro={erros.confirmacao}
          required
        />

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 flex h-13 w-full items-center justify-center rounded-xl bg-[#009B4D] px-5 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,0.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[#69747e]">
        Já possui uma conta?{' '}
        <Link to="/login" className="rounded-md font-semibold text-[#15693E] underline-offset-4 transition hover:text-[#009B4D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
