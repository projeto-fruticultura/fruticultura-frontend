import { ArrowLeft, Droplets, Leaf, Pencil, Sprout, Thermometer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { useAuth } from '@/context/AuthContext'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { culturaService } from '@/services/culturaService'
import type { Cultura } from '@/types/api'

function calcularFaixaPercentual(min: number, max: number, escalaMax: number) {
  const inicio = Math.max(0, Math.min(100, (min / escalaMax) * 100))
  const fim = Math.max(inicio + 6, Math.min(100, (max / escalaMax) * 100))
  return {
    left: `${inicio}%`,
    width: `${fim - inicio}%`,
  }
}

export default function DetalheCultura() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const podeEditar = podeEscrever(usuario?.perfil)

  const [cultura, setCultura] = useState<Cultura | null>(null)
  const [erro, setErro] = useState('')
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregarCultura() {
      try {
        const dados = await culturaService.buscarPorId(Number(id))
        if (ativo) setCultura(dados)
      } catch (error) {
        if (!ativo) return
        if (error instanceof ApiError && error.status === 404) {
          setNaoEncontrada(true)
        }
        setErro(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar a cultura.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarCultura()

    return () => {
      ativo = false
    }
  }, [id])

  if (carregando) {
    return (
      <AppShell section="culturas">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="grid min-h-[320px] place-items-center rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
            <div className="text-center" role="status">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
              <p className="mt-4 text-sm text-[#68756d]">
                Carregando cultura...
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (erro) {
    return (
      <AppShell section="culturas">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="rounded-[24px] border border-[#e1e7e3] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
              <Leaf size={26} />
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-[#18251e]">
              {naoEncontrada
                ? 'Cultura não encontrada'
                : 'Não foi possível carregar a cultura'}
            </h1>

            <p className="mt-2 text-sm text-[#68756d]">
              {naoEncontrada
                ? 'A cultura solicitada não está disponível.'
                : erro}
            </p>

            <Link
              to="/culturas"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white transition hover:bg-[#008844]"
            >
              <ArrowLeft size={17} />
              Voltar para culturas
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!cultura) {
    return null
  }

  const faixaTemp = calcularFaixaPercentual(
    Number(cultura.temperaturaMin),
    Number(cultura.temperaturaMax),
    50,
  )
  const faixaUmid = calcularFaixaPercentual(
    Number(cultura.umidadeMin),
    Number(cultura.umidadeMax),
    100,
  )

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            {
              label: 'Culturas',
              to: '/culturas',
            },
            {
              label: cultura.nome,
            },
          ]}
        />

        <Link
          to="/culturas"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para culturas
        </Link>

        {/* Cabeçalho padronizado */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <Sprout size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  {cultura.nome}
                </h1>

                <p className="mt-1.5 text-sm font-medium text-[#526058]">
                  {cultura.variedade
                    ? `Variedade: ${cultura.variedade}`
                    : 'Cultivar padrão'}
                  {' • '}
                  <span className="font-mono text-xs font-semibold text-[#68756d]">
                    CULT-{String(cultura.id).padStart(3, '0')}
                  </span>
                </p>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Visualização dos parâmetros climáticos ideais e especificações
                  cadastradas para esta cultura.
                </p>
              </div>
            </div>

            {podeEditar ? (
              <Link
                to={`/culturas/${cultura.id}/editar`}
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Pencil size={17} aria-hidden="true" />
                Editar cultura
              </Link>
            ) : null}
          </div>
        </section>

        {/* Parâmetros de Cultivo */}
        <section className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-1 border-b border-[#edf1ee] pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#18251e]">
              Parâmetros climáticos recomendados
            </h2>

            <p className="text-sm text-[#718078]">
              Limites utilizados como referência para o monitoramento e emissão
              de alertas nos lotes vinculados.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* Temperatura */}
            <article className="overflow-hidden rounded-2xl border border-amber-200/70 bg-amber-50/35">
              <div className="flex items-center gap-3 border-b border-amber-200/60 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                  <Thermometer size={20} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="font-semibold text-[#1c2922]">
                    Faixa térmica ideal
                  </h3>
                  <p className="text-xs text-[#68756d]">
                    Temperatura mínima e máxima suportada
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#18251e]">
                      {cultura.temperaturaMin} °C
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#68756d]">
                      Mínima
                    </p>
                  </div>

                  <div className="h-px flex-1 bg-amber-200/70" />

                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#18251e]">
                      {cultura.temperaturaMax} °C
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#68756d]">
                      Máxima
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div
                    title={`Zona ideal: ${cultura.temperaturaMin} °C a ${cultura.temperaturaMax} °C (escala de 0 °C a 50 °C)`}
                    className="relative h-2.5 w-full overflow-hidden rounded-full bg-amber-100"
                  >
                    <span
                      style={faixaTemp}
                      className="absolute top-0 bottom-0 rounded-full bg-amber-500"
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>0 °C</span>
                    <span>25 °C</span>
                    <span>50 °C</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Umidade */}
            <article className="overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/35">
              <div className="flex items-center gap-3 border-b border-sky-200/60 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/80 text-sky-700">
                  <Droplets size={20} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="font-semibold text-[#1c2922]">
                    Umidade relativa ideal
                  </h3>
                  <p className="text-xs text-[#68756d]">
                    Intervalo hídrico recomendado
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#18251e]">
                      {cultura.umidadeMin}%
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#68756d]">
                      Mínima
                    </p>
                  </div>

                  <div className="h-px flex-1 bg-sky-200/70" />

                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#18251e]">
                      {cultura.umidadeMax}%
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#68756d]">
                      Máxima
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div
                    title={`Zona ideal: ${cultura.umidadeMin}% a ${cultura.umidadeMax}% (escala de 0% a 100%)`}
                    className="relative h-2.5 w-full overflow-hidden rounded-full bg-sky-100"
                  >
                    <span
                      style={faixaUmid}
                      className="absolute top-0 bottom-0 rounded-full bg-sky-500"
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Informações Gerais */}
        <section className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="border-b border-[#edf1ee] pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#18251e]">
              Informações da cultura
            </h2>

            <p className="mt-1 text-sm text-[#718078]">
              Dados gerais e observações agronômicas do cadastro.
            </p>
          </div>

          <dl className="mt-5 divide-y divide-[#edf1ee]">
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">
                Nome da cultura
              </dt>
              <dd className="text-sm font-semibold text-[#29362f]">
                {cultura.nome}
              </dd>
            </div>

            {cultura.variedade ? (
              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-sm font-medium text-[#75827a]">
                  Variedade
                </dt>
                <dd className="text-sm font-semibold text-[#29362f]">
                  {cultura.variedade}
                </dd>
              </div>
            ) : null}

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">
                Identificador
              </dt>
              <dd className="font-mono text-xs font-semibold text-[#29362f]">
                CULT-{String(cultura.id).padStart(3, '0')}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4">
              <dt className="text-sm font-medium text-[#75827a]">Descrição</dt>
              <dd className="mt-1 text-sm leading-6 text-[#29362f]">
                {cultura.descricao || 'Nenhuma descrição cadastrada.'}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-medium text-[#75827a]">Status</dt>
              <dd>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Ativa
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  )
}