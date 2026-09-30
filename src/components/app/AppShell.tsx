import { Bell, ChevronRight, Cpu, LayoutDashboard, Leaf, LogOut, Menu, Sprout, X, ChartNoAxesCombined } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PwaInstallButton } from '@/components/ui/PwaInstallButton'

interface AppShellProps {
  children: ReactNode
  section?: 'overview' | 'properties' | 'cultures' | 'culturas'
}

const navItems = [
  { label: 'Visão geral', to: '/', icon: LayoutDashboard, key: 'overview' as const },
  { label: 'Propriedades', to: '/propriedades', icon: Leaf, key: 'properties' as const },
  { label: 'Culturas', to: '/culturas', icon: Sprout, key: 'culturas' as const },
]

function formatCurrentDate() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(new Date())
    .replace('.', '')
    .toUpperCase()
}

function getInitials(name?: string) {
  if (!name) return 'VS'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function AppShell({ children, section = 'properties' }: AppShellProps) {
  const { usuario, sair } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="flex min-h-[76px] items-center justify-between border-b border-white/10 px-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 rounded-xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12">
            <Sprout size={21} aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em]">ValeSafra</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navegação da plataforma">
        {navItems.map(({ label, to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                isActive || section === key
                  ? 'bg-[#063b2d] text-white shadow-sm'
                  : 'text-white/82 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-white/45" aria-disabled="true">
            <Cpu size={18} aria-hidden="true" />
            <span className="flex-1">Sensores</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Em breve</span>
          </div>
          <div className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-white/45" aria-disabled="true">
            <ChartNoAxesCombined size={18} aria-hidden="true" />
            <span className="flex-1">Dados de Mercado</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Em breve</span>
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void sair()}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <LogOut size={18} aria-hidden="true" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-[100dvh] bg-[#f5f8f6] text-[#1F2933] lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-hidden bg-[linear-gradient(180deg,#0e5138_0%,#14714d_55%,#1d8a61_100%)] lg:flex">
        {sidebarContent}
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col overflow-hidden bg-[linear-gradient(180deg,#0e5138_0%,#14714d_55%,#1d8a61_100%)] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-[#e1e7e3] bg-white/95 backdrop-blur-md">
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce5df] text-[#32443a] transition hover:bg-[#f3f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819087]">Hoje</p>
                <p className="mt-0.5 text-sm font-semibold text-[#33433b]">{formatCurrentDate()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <PwaInstallButton compact className="hidden sm:inline-flex" />

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#4c5d53] transition hover:bg-[#f3f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                aria-label="Notificações"
              >
                <Bell size={18} />
              </button>

              <div className="hidden h-8 w-px bg-[#e1e7e3] sm:block" aria-hidden="true" />

              <div className="flex items-center gap-2 rounded-full bg-[#f3f6f4] py-1.5 pl-3 pr-1.5">
                <div className="hidden text-right sm:block">
                  <p className="max-w-[180px] truncate text-xs font-semibold text-[#334139]">{usuario?.nome ?? 'Usuário ValeSafra'}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#7b887f]">{usuario?.perfil ?? 'Conta'}</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#009B4D] text-[11px] font-bold text-white">
                  {getInitials(usuario?.nome)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-68px)]">{children}</main>
      </div>
    </div>
  )
}

export function PageBreadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#75827a]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
            {item.to ? (
              <Link to={item.to} className="font-medium transition hover:text-[#15693E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-[#3e4c44]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
