import { MapPin } from 'lucide-react'

interface PropertyLocationPreviewProps {
  latitude?: string | number
  longitude?: string | number
  cidade?: string
  uf?: string
}

export function PropertyLocationPreview({ latitude, longitude, cidade, uf }: PropertyLocationPreviewProps) {
  const hasCoordinates = latitude !== '' && longitude !== '' && latitude !== undefined && longitude !== undefined

  return (
    <div className="relative min-h-[270px] overflow-hidden rounded-2xl border border-[#dce5df] bg-[#eef2ef]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(rgba(86,113,98,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(86,113,98,.12) 1px, transparent 1px), radial-gradient(circle at 25% 35%, rgba(21,105,62,.13), transparent 24%), radial-gradient(circle at 78% 68%, rgba(0,155,77,.12), transparent 26%)',
          backgroundSize: '34px 34px, 34px 34px, 100% 100%, 100% 100%',
        }}
      />
      <div className="absolute left-[18%] top-[18%] h-16 w-36 rotate-[-8deg] rounded-full border border-[#bdc9c1]/70" />
      <div className="absolute right-[12%] top-[28%] h-28 w-24 rotate-[17deg] rounded-full border border-[#bdc9c1]/70" />
      <div className="absolute bottom-[12%] left-[30%] h-20 w-44 rotate-[6deg] rounded-full border border-[#bdc9c1]/70" />

      <div className="relative z-10 flex min-h-[270px] flex-col items-center justify-center px-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#15693E] text-white shadow-[0_12px_30px_rgba(21,105,62,.28)]">
          <MapPin size={22} aria-hidden="true" />
        </span>
        <div className="mt-4 rounded-xl border border-white/80 bg-white/92 px-4 py-3 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold text-[#2e3e35]">
            {cidade || uf ? `${cidade || 'Localização'}${cidade && uf ? ' - ' : ''}${uf || ''}` : 'Prévia da localização'}
          </p>
          <p className="mt-1 text-xs text-[#6e7b73]">
            {hasCoordinates ? `Lat. ${latitude} · Long. ${longitude}` : 'Informe latitude e longitude para posicionar a propriedade.'}
          </p>
        </div>
      </div>
    </div>
  )
}
