// src/components/app/ClimaValeTicker.tsx
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface CidadeVale {
  nome: string
  uf: string
  lat: number
  lon: number
}

interface ClimaCidade {
  nome: string
  uf: string
  temperatura: number
  umidade: number
  codigoClima: number
}

const CIDADES_VALE: CidadeVale[] = [
  { nome: 'Petrolina', uf: 'PE', lat: -9.3891, lon: -40.5027 },
  { nome: 'Juazeiro', uf: 'BA', lat: -9.4162, lon: -40.5033 },
  { nome: 'Lagoa Grande', uf: 'PE', lat: -8.9958, lon: -40.2731 },
  { nome: 'Santa Maria da Boa Vista', uf: 'PE', lat: -8.7986, lon: -39.8256 },
  { nome: 'Casa Nova', uf: 'BA', lat: -9.1631, lon: -40.9786 },
]

const CACHE_KEY = 'valesafra_clima_vale_v1'
const CACHE_TTL_MS = 15 * 60 * 1000
const INTERVALO_TRANSICAO_MS = 6000

function descreverClima(codigo: number) {
  if (codigo === 0) {
    return { texto: 'Céu limpo', Icone: Sun, corIcone: 'text-[#F59E0B]' }
  }
  if (codigo <= 2) {
    return { texto: 'Parcialmente nublado', Icone: CloudSun, corIcone: 'text-[#EAB308]' }
  }
  if (codigo === 3) {
    return { texto: 'Nublado', Icone: Cloud, corIcone: 'text-[#64748B]' }
  }
  if (codigo >= 51 && codigo <= 57) {
    return { texto: 'Garoa', Icone: CloudDrizzle, corIcone: 'text-[#0EA5E9]' }
  }
  if (codigo >= 61 && codigo <= 82) {
    return { texto: 'Chuva', Icone: CloudRain, corIcone: 'text-[#2563EB]' }
  }
  if (codigo >= 95) {
    return { texto: 'Trovoada', Icone: CloudLightning, corIcone: 'text-[#7C3AED]' }
  }
  return { texto: 'Tempo firme', Icone: CloudSun, corIcone: 'text-[#EAB308]' }
}

export function ClimaValeTicker() {
  const [dadosClima, setDadosClima] = useState<ClimaCidade[]>([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [cicloKey, setCicloKey] = useState(0)

  useEffect(() => {
    let ativo = true

    async function carregarClimaVale() {
      try {
        const cacheSalvo = sessionStorage.getItem(CACHE_KEY)
        if (cacheSalvo) {
          const parsed = JSON.parse(cacheSalvo) as {
            timestamp: number
            itens: ClimaCidade[]
          }
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.itens.length > 0) {
            if (ativo) setDadosClima(parsed.itens)
            return
          }
        }

        const lats = CIDADES_VALE.map((c) => c.lat).join(',')
        const lons = CIDADES_VALE.map((c) => c.lon).join(',')
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America%2FRecife`

        const resposta = await fetch(url)
        if (!resposta.ok) return

        const json = (await resposta.json()) as Array<{
          current?: {
            temperature_2m?: number
            relative_humidity_2m?: number
            weather_code?: number
          }
        }>

        if (!Array.isArray(json)) return

        const listaFormatada: ClimaCidade[] = CIDADES_VALE.map((cidade, idx) => {
          const atual = json[idx]?.current
          return {
            nome: cidade.nome,
            uf: cidade.uf,
            temperatura: Math.round(atual?.temperature_2m ?? 30),
            umidade: Math.round(atual?.relative_humidity_2m ?? 50),
            codigoClima: atual?.weather_code ?? 1,
          }
        })

        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), itens: listaFormatada }),
        )

        if (ativo) setDadosClima(listaFormatada)
      } catch {
        // Silencioso
      }
    }

    void carregarClimaVale()

    return () => {
      ativo = false
    }
  }, [])

  if (dadosClima.length === 0) {
    return null
  }

  const cidade = dadosClima[indiceAtual]
  const { texto, Icone, corIcone } = descreverClima(cidade.codigoClima)

  function avancarCidade() {
    setIndiceAtual((prev) => (prev + 1) % dadosClima.length)
    setCicloKey((k) => k + 1)
  }

  return (
    <>
      <style>{`
        @keyframes tickerSlideUp {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tickerFadeProgress {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }
      `}</style>

      <button
        type="button"
        onClick={avancarCidade}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        title="Clima no Vale do São Francisco (clique para alternar cidade)"
        aria-label={`Clima em ${cidade.nome}-${cidade.uf}: ${cidade.temperatura}°C, umidade ${cidade.umidade}%, ${texto}. Clique para próxima cidade.`}
        className="group relative hidden cursor-pointer items-center rounded-lg px-1 py-1.5 text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] md:inline-flex"
      >
        <div
          key={`${cidade.nome}-${cicloKey}`}
          style={{
            animation: 'tickerSlideUp 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
          className="flex items-center gap-2.5"
        >
          <Icone
            size={18}
            strokeWidth={2}
            className={`shrink-0 ${corIcone}`}
            aria-hidden="true"
          />

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-[#1f2d25]">
                {cidade.nome}, {cidade.uf}
              </span>
              <span className="text-[11px] font-medium text-[#8a9890]">
                {cidade.temperatura}°C
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-[#7a8980]">
              {texto} • Umidade {cidade.umidade}%
            </p>
          </div>
        </div>

        {dadosClima.length > 1 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 bottom-0 block h-[1.5px] overflow-hidden rounded-full bg-[#e6ece8]"
          >
            <span
              key={`line-${cicloKey}`}
              onAnimationEnd={avancarCidade}
              style={{
                animation: `tickerFadeProgress ${INTERVALO_TRANSICAO_MS}ms linear forwards`,
                animationPlayState: pausado ? 'paused' : 'running',
              }}
              className="block h-full w-full origin-left bg-[#9bb5a6]"
            />
          </span>
        )}
      </button>
    </>
  )
}