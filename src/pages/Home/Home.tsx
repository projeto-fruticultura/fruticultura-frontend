import { ArrowRight, ChartNoAxesCombined, Leaf, MapPinned, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const recursos = [
  {
    titulo: 'Propriedades organizadas',
    descricao: 'Cadastre e consulte propriedades em um ambiente centralizado, com informações essenciais sempre acessíveis.',
    icone: MapPinned,
  },
  {
    titulo: 'Visão da operação',
    descricao: 'Acompanhe indicadores disponíveis de lotes e sensores a partir dos dados vinculados às propriedades.',
    icone: ChartNoAxesCombined,
  },
  {
    titulo: 'Base pronta para evoluir',
    descricao: 'A interface foi estruturada para receber novos módulos sem comprometer consistência, navegação ou responsividade.',
    icone: Leaf,
  },
]

export default function Home() {
  const { usuario } = useAuth()

  return (
    <div className="min-h-[100dvh] bg-[#f6faf7] text-[#1F2933]">
      <header className="sticky top-0 z-30 border-b border-[#e4ece7] bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] focus-visible:ring-offset-4"
            aria-label="Página inicial do ValeSafra"
          >
            <img src="/assets/valesafra-logo.png" alt="ValeSafra" className="h-auto w-[170px] sm:w-[185px]" />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Navegação principal">
            {usuario ? (
              <Link
                to="/propriedades"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#009B4D] px-4 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                Acessar painel
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold text-[#15693E] transition hover:bg-[#eff7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] sm:px-4"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#009B4D] px-4 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(480px,1.05fr)] lg:items-center lg:px-12 lg:py-20 xl:gap-16">
          <div className="max-w-[650px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e8de] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#15693E] shadow-sm">
              <Sprout size={15} aria-hidden="true" /> Gestão agrícola inteligente
            </span>

            <h1 className="mt-6 text-[clamp(2.75rem,5.3vw,5.35rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#12212a]">
              Informação clara para decisões melhores no campo.
            </h1>

            <p className="mt-6 max-w-[610px] text-base leading-8 text-[#5c6872] sm:text-lg">
              O ValeSafra reúne a gestão das propriedades em uma experiência web simples, responsiva e preparada para acompanhar a evolução da operação agrícola.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={usuario ? '/propriedades' : '/login'}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-6 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(0,155,77,0.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                {usuario ? 'Ir para propriedades' : 'Acessar a plataforma'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              {!usuario ? (
                <Link
                  to="/cadastro"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#d4e2d9] bg-white px-6 text-[15px] font-semibold text-[#15693E] transition hover:bg-[#f0f7f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                >
                  Começar agora
                </Link>
              ) : null}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white bg-[#dfeee5] shadow-[0_28px_80px_rgba(31,41,51,0.12)] sm:rounded-[36px]">
            <div className="aspect-[4/3] min-h-[380px] lg:min-h-[560px]">
              <img
                src="/assets/auth-orchard.png"
                alt="Pomar de laranjeiras representando a produção agrícola conectada"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,28,19,0.03)_0%,rgba(4,28,19,0.10)_42%,rgba(4,28,19,0.72)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ff0bd]">Produção conectada</p>
              <h2 className="mt-2 max-w-[580px] text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
                Tecnologia aplicada ao acompanhamento da sua operação.
              </h2>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e1ebe4] bg-white" aria-labelledby="recursos-title">
          <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-18">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#009B4D]">Experiência ValeSafra</p>
              <h2 id="recursos-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#15232c] sm:text-4xl">
                Uma base simples para organizar o que importa.
              </h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {recursos.map(({ titulo, descricao, icone: Icone }) => (
                <article key={titulo} className="rounded-[24px] border border-[#e0e9e3] bg-[#fbfdfb] p-6 sm:p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf6ee] text-[#15693E]">
                    <Icone size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#17252e]">{titulo}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5e6973]">{descricao}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#10251b] text-white/70">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-8 text-sm sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <span className="text-base font-semibold text-white">ValeSafra</span>
          <p>Tecnologia para apoiar a gestão agrícola.</p>
        </div>
      </footer>
    </div>
  )
}
