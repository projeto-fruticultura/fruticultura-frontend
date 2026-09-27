import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type FeedbackVariant = 'error' | 'success' | 'info'

interface FeedbackMessageProps {
  children: string
  variant?: FeedbackVariant
}

const styles: Record<FeedbackVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

export function FeedbackMessage({ children, variant = 'info' }: FeedbackMessageProps) {
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info
  const role = variant === 'error' ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${styles[variant]}`}
    >
      <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
