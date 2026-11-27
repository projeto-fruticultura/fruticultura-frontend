import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent: string
  helper?: string
}

export function MetricCard({ label, value, icon: Icon, accent, helper }: MetricCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#e7ece9] bg-[#fbfcfb] px-4 py-4 shadow-[0_2px_8px_rgba(28,50,37,0.04)]">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div>
          <p className="text-xs font-semibold text-[#5f6d65]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1b2821]">{value}</p>
          {helper ? <p className="mt-1 text-[10px] leading-4 text-[#8a958f]">{helper}</p> : null}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5c6c63] shadow-sm">
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

