import { Download, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface PwaInstallButtonProps {
  compact?: boolean
  className?: string
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

export function PwaInstallButton({ compact = false, className = '' }: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    setInstalled(isStandaloneMode())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!online) {
    return (
      <span
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800 ${className}`}
        role="status"
      >
        <WifiOff size={16} aria-hidden="true" />
        {compact ? 'Offline' : 'Sem conexão'}
      </span>
    )
  }

  if (installed || !installPrompt) return null

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d7e4dc] bg-white px-3 text-sm font-semibold text-[#15693E] transition hover:bg-[#f1f8f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] ${className}`}
      aria-label="Instalar ValeSafra neste dispositivo"
    >
      <Download size={16} aria-hidden="true" />
      {compact ? 'Instalar' : 'Instalar app'}
    </button>
  )
}
