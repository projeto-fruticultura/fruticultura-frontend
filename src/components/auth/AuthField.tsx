import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  erro?: string
  hint?: string
}

export function AuthField({
  id,
  label,
  erro,
  hint,
  type = 'text',
  className = '',
  required,
  ...props
}: AuthFieldProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const ehSenha = type === 'password'
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = erro ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-[#27343e]">
        {label}
        {required ? <span className="ml-1 text-[#b42318]" aria-hidden="true">*</span> : null}
      </label>

      <div className="relative">
        <input
          {...props}
          id={id}
          type={ehSenha && mostrarSenha ? 'text' : type}
          required={required}
          aria-required={required || undefined}
          aria-invalid={Boolean(erro)}
          aria-describedby={describedBy}
          className={`h-13 w-full rounded-xl border bg-white px-4 text-[15px] text-[#1f2933] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition placeholder:text-[#929aa4] hover:border-[#b7c5bc] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10 ${erro ? 'border-red-400' : 'border-[#d5ded8]'} ${ehSenha ? 'pr-12' : ''} ${className}`}
        />

        {ehSenha ? (
          <button
            type="button"
            onClick={() => setMostrarSenha((valor) => !valor)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#707b85] transition hover:bg-[#f2f7f4] hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={mostrarSenha}
          >
            {mostrarSenha ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      {hint && !erro ? <p id={hintId} className="text-xs leading-5 text-[#6f7983]">{hint}</p> : null}
      {erro ? <p id={errorId} className="text-xs font-medium leading-5 text-red-700">{erro}</p> : null}
    </div>
  )
}
