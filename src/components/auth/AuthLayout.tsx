import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-[100dvh] bg-[#FFFFFF] text-[#1F2933]">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(420px,1fr)_minmax(560px,57vw)] xl:grid-cols-[minmax(460px,1fr)_minmax(660px,60vw)]">
        <section className="relative flex min-h-[100dvh] min-w-0 flex-col overflow-hidden">
          <header className="relative z-10 flex w-full items-center border-b border-[#e1e7e3] px-8 py-4 sm:px-12 sm:py-5 lg:px-14 xl:px-16">
            <Link
              to="/"
              className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] focus-visible:ring-offset-4"
              aria-label="Ir para a página inicial do ValeSafra"
            >
              <img
                src="/assets/logo-valesafra2.svg"
                alt="ValeSafra"
                className="h-auto w-[140px] object-contain sm:w-[160px]"
              />
            </Link>
          </header>

          <div className="relative z-10 my-auto flex w-full justify-center px-5 py-8 sm:px-8 lg:px-8 xl:px-10">
            <div className="w-full max-w-[490px] min-w-0 p-5 sm:p-7">
              {children}
            </div>
          </div>
        </section>

        <aside
          className="relative hidden min-h-[100dvh] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-10 lg:pt-20 lg:pb-14 xl:px-14 xl:pt-24 xl:pb-16"
          aria-label="Apresentação visual do ValeSafra"
        >
          <img
            src="/assets/bg-login.jpg"
            alt="Pomar de laranjeiras sob céu azul"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,25,17,0.52)_0%,rgba(3,25,17,0.16)_44%,rgba(3,25,17,0.82)_100%)]" />

          <div className="relative z-10 self-start">
            <h2
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className="text-[36px] font-bold leading-[48px] tracking-[-0.03em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.28)]"
            >
              Cultivando novas
              <span className="block text-[#54DA97]">possibilidades</span>
            </h2>
          </div>

          <div className="relative z-10 self-end text-right">
            <h2
              style={{ fontFamily: "'Montserrat', sans-serif" }}
              className="text-[36px] font-bold leading-[48px] tracking-[-0.03em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            >
              A produção conectada
              <span className="block text-[#54DA97]">à tecnologia</span>
            </h2>
          </div>
        </aside>
      </div>
    </main>
  )
}