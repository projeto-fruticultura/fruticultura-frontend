import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, ShieldCheck } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-[100dvh] bg-[#f5faf7] text-[#1F2933]">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(520px,42rem)_1fr] xl:grid-cols-[minmax(600px,45rem)_1fr]">
        <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#009B4D]/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[#15693E]/8 blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-[520px]">
            <Link
              to="/"
              className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] focus-visible:ring-offset-4"
              aria-label="Ir para a página inicial do ValeSafra"
            >
              <img
                src="/assets/valesafra-logo.png"
                alt="ValeSafra"
                className="h-auto w-[185px] object-contain sm:w-[205px]"
              />
            </Link>

            <div className="mt-8 rounded-[26px] border border-[#deebe3] bg-white p-6 shadow-[0_18px_60px_rgba(31,41,51,0.08)] sm:p-8 lg:mt-10">
              {children}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#66727d]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#15693E]" aria-hidden="true" />
                Acesso protegido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Leaf size={15} className="text-[#15693E]" aria-hidden="true" />
                Gestão agrícola integrada
              </span>
            </div>
          </div>
        </section>

        <aside className="relative hidden min-h-[100dvh] overflow-hidden lg:block" aria-label="Apresentação visual do ValeSafra">
          <img
            src="/assets/auth-orchard.png"
            alt="Pomar de laranjeiras sob céu azul"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,25,17,0.08)_0%,rgba(3,25,17,0.20)_44%,rgba(3,25,17,0.78)_100%)]" />

          <div className="absolute left-8 top-8 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md xl:left-12 xl:top-10">
            Agricultura + tecnologia
          </div>

          <div className="absolute inset-x-0 bottom-0 p-8 xl:p-12 2xl:p-16">
            <div className="max-w-[650px]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ff0bd]">ValeSafra</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-5xl 2xl:text-6xl">
                Decisões mais simples para uma produção mais conectada.
              </h2>
              <p className="mt-5 max-w-[560px] text-base leading-7 text-white/82 xl:text-lg xl:leading-8">
                Centralize informações da operação agrícola em uma experiência web clara, responsiva e preparada para evoluir com novos módulos.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
