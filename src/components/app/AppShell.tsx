import {
  Bell,
  ChevronDown,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  Leaf,
  Menu,
  Sprout,
  X,
  MapPinned,
  Users,
  Truck,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PwaInstallButton } from "@/components/ui/PwaInstallButton";
import { ClimaValeTicker } from "./ClimaValeTicker";

interface AppShellProps {
  children: ReactNode;
  section?:
    | "overview"
    | "properties"
    | "culturas"
    | "sensores"
    | "lotes"
    | "usuarios"
    | "logistica"
    | "mercado"
    | "iot";
}

const baseNavItems = [
  {
    label: "Visão geral",
    to: "/painel",
    icon: LayoutDashboard,
    key: "overview" as const,
  },
  {
    label: "Propriedades",
    to: "/propriedades",
    icon: Leaf,
    key: "properties" as const,
  },
  {
    label: "Culturas",
    to: "/culturas",
    icon: Sprout,
    key: "culturas" as const,
  },
  { label: "Lotes", to: "/lotes", icon: MapPinned, key: "lotes" as const },
  { label: "Sensores", to: "/sensores", icon: Cpu, key: "sensores" as const },
];

function formatCurrentDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date())
    .replace(".", "")
    .toUpperCase();
}

function getInitials(name?: string) {
  if (!name) return "VS";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getFirstName(name?: string) {
  const first = name?.trim().split(/\s+/)[0];
  return first || "Usuário";
}

export function AppShell({ children, section = "properties" }: AppShellProps) {
  const { usuario, sair } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen && !userDrawerOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setUserDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, userDrawerOpen]);

  // Define os itens do menu conforme o perfil do usuário
  const navItems =
    usuario?.perfil === "ADMIN"
      ? [
          ...baseNavItems,
          {
            label: "Usuários",
            to: "/usuarios",
            icon: Users,
            key: "usuarios" as const,
          },
        ]
      : usuario?.perfil === "TECNICO"
        ? [
            {
              label: "Visão geral",
              to: "/painel",
              icon: LayoutDashboard,
              key: "overview" as const,
            },
            {
              label: "Propriedades",
              to: "/propriedades",
              icon: Leaf,
              key: "properties" as const,
            },
            {
              label: "Lotes",
              to: "/lotes",
              icon: MapPinned,
              key: "lotes" as const,
            },
            {
              label: "Sensores",
              to: "/sensores",
              icon: Cpu,
              key: "sensores" as const,
            },
            {
              label: "Configuração IoT",
              to: "/sensores/config",
              icon: Settings,
              key: "iot" as const,
            },
          ]
        : [
            ...baseNavItems,
            {
              label: "Logística",
              to: "/logistica",
              icon: Truck,
              key: "logistica" as const,
            },
            {
              label: "Mercado",
              to: "/mercado",
              icon: TrendingUp,
              key: "mercado" as const,
            },
          ];

  const sidebarContent = (
    <>
      <div className="flex min-h-[76px] items-center justify-between border-b border-white/10 px-5">
        <Link
          to="/painel"
          className="h-12 flex items-center"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/assets/logo-valesafra.svg"
            alt="Logo ValeSafra"
            className="h-8 w-auto"
          />
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

      <nav
        className="flex-1 space-y-1 px-3 py-5"
        aria-label="Navegação da plataforma"
      >
        {navItems.map(({ label, to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={usuario?.perfil === "TECNICO" && to === "/sensores"}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                isActive || section === key
                  ? "bg-[#063b2d] text-white shadow-sm"
                  : "text-white/82 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f5f8f6] text-[#1F2933] lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-hidden bg-[linear-gradient(180deg,#0C432C_0%,#1B8868_55%,#78BF5F_100%)] lg:flex">
        {sidebarContent}
      </aside>

      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
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

      {userDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Menu da conta"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setUserDrawerOpen(false)}
            aria-label="Fechar menu da conta"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col justify-between border-l border-[#e1e7e3] bg-white shadow-2xl">
            <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#e1e7e3] px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#7ecba3] bg-[#cdeedd] text-base font-extrabold text-[#05472a]">
                  {getInitials(usuario?.nome)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#18251e]">
                    Olá, {getFirstName(usuario?.nome)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#68756d]">Tudo bem?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUserDrawerOpen(false)}
                className="shrink-0 rounded-xl p-2 text-[#4c5d53] transition hover:bg-[#f3f7f4] hover:text-[#18251e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                aria-label="Fechar menu da conta"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-t border-[#e1e7e3] p-4">
              <button
                type="button"
                onClick={() => {
                  setUserDrawerOpen(false);
                  void sair();
                }}
                className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-red-300 bg-red-100/75 px-4 text-sm font-semibold text-[#991b1b] shadow-2xs transition hover:border-red-400 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Sair
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-[#e1e7e3] bg-white/95 backdrop-blur-md">
          <div className="flex min-h-[68px] items-center justify-between gap-2.5 px-3.5 sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce5df] text-[#32443a] transition hover:bg-[#f3f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>

              <div className="hidden shrink-0 sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#819087]">
                  Hoje
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#33433b]">
                  {formatCurrentDate()}
                </p>
              </div>

              <div
                className="hidden h-8 w-px shrink-0 bg-[#e1e7e3] sm:block"
                aria-hidden="true"
              />

              <ClimaValeTicker />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <PwaInstallButton compact className="hidden sm:inline-flex" />

              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#4c5d53] transition hover:bg-[#f3f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                aria-label="Notificações"
              >
                <Bell size={18} />
              </button>

              <div
                className="hidden h-8 w-px bg-[#e1e7e3] sm:block"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => setUserDrawerOpen(true)}
                aria-expanded={userDrawerOpen}
                aria-haspopup="dialog"
                aria-label="Abrir menu da conta"
                className="group flex shrink-0 cursor-pointer items-center rounded-full border border-[#d2ddd7] bg-white p-1 shadow-2xs transition hover:border-[#86c8a6] hover:bg-[#f4faf6] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b663e]/40 sm:gap-2.5 sm:py-1.5 sm:pl-2 sm:pr-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#7ecba3] bg-[#cdeedd] text-xs font-extrabold tracking-tight text-[#05472a] transition group-hover:border-[#5eb98b] group-hover:bg-[#bee7d3]">
                  {getInitials(usuario?.nome)}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[115px] truncate text-xs font-semibold leading-tight text-[#1e2c25] md:max-w-[165px] lg:max-w-[190px]">
                    {usuario?.nome ?? "Usuário ValeSafra"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-[#55665d]">
                    {usuario?.perfil ?? "Conta"}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  aria-hidden="true"
                  className={`hidden shrink-0 text-[#3d4d44] transition-transform duration-200 group-hover:text-[#05472a] sm:block ${
                    userDrawerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-68px)]">{children}</main>
      </div>
    </div>
  );
}

export function PageBreadcrumb({
  items,
}: {
  items: Array<{ label: string; to?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#75827a]">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
            {item.to ? (
              <Link
                to={item.to}
                className="font-medium transition hover:text-[#15693E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-[#3e4c44]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}