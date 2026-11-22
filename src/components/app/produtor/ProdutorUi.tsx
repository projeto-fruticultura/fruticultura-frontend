import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export const cartao = 'rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6'
export const campo = 'min-h-11 w-full rounded-xl border border-[#dce4df] bg-[#f6f8f7] px-3 text-sm text-[#35453c] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10'
export const botao = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#087a49] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#075d39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
export const botaoSecundario = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-4 py-2 text-sm font-semibold text-[#365449] transition hover:bg-[#f3f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:opacity-50'

export function CabecalhoProdutor({ titulo, descricao, acao }: { titulo: string; descricao: string; acao?: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div><h1 className="text-[clamp(1.55rem,2.6vw,2rem)] font-semibold tracking-[-0.035em] text-[#18251e]">{titulo}</h1>
      <p className="mt-1 text-sm leading-6 text-[#6f7c74]">{descricao}</p></div>
    {acao}
  </div>
}

export function IndicadorProdutor({ nome, valor, ajuda, icone: Icon }: { nome: string; valor: string | number; ajuda?: string; icone: LucideIcon }) {
  return <article className="rounded-xl border border-[#e6ece8] bg-[#fbfcfb] px-4 py-4">
    <div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-[#5f6d65]">{nome}</p>
      <Icon size={18} className="text-[#168150]" aria-hidden="true" /></div>
    <p className="mt-2 text-2xl font-semibold text-[#1b2821]">{valor}</p>
    {ajuda ? <p className="mt-1 text-xs leading-5 text-[#7a8780]">{ajuda}</p> : null}
  </article>
}

export function Campo({ rotulo, children, erro, erroId }: { rotulo: string; children: ReactNode; erro?: string; erroId?: string }) {
  return <div>
    <label className="block text-sm font-semibold text-[#526158]">
      {rotulo}<span className="mt-1.5 block">{children}</span>
    </label>
    {erro ? <p id={erroId} className="mt-1 text-xs font-medium text-red-700">{erro}</p> : null}
  </div>
}

export function EstadoVazio({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[#dbe5df] bg-[#fbfcfb] px-4 py-8 text-center text-sm text-[#6f7c74]">{children}</div>
}
