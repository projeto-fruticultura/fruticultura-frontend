import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6faf7] px-5 text-[#15693E]">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/20 border-t-[#009B4D]"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold">Carregando sua sessão...</p>
        </div>
      </main>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />

  return <Outlet />
}