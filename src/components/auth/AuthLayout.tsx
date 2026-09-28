import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-[100dvh] bg-[#FFFFFF] text-[#1F2933]">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(520px,48rem)_1fr] xl:grid-cols-[minmax(600px,52rem)_1fr]">
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

            <div className="mt-8 p-6 sm:p-8 lg:mt-10">
              {children}
            </div>
          </div>
        </section>

        <aside className="relative hidden min-h-[100dvh] overflow-hidden lg:block" aria-label="Apresentação visual do ValeSafra">
          <img
            src="/assets/orchard-bg.png"
            alt="Pomar de laranjeiras sob céu azul"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,25,17,0.08)_0%,rgba(3,25,17,0.20)_44%,rgba(3,25,17,0.78)_100%)]" />

        </aside>
      </div>
    </main>
  )
}
