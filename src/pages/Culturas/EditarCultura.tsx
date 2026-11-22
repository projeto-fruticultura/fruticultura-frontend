import { ArrowLeft, Droplets, LoaderCircle, Sprout, Thermometer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { culturaService } from '@/services/culturaService'
import type { Cultura } from '@/types/api'

import { ErroCampo } from './ErroCampo'
import {
  CULTURA_VAZIA,
  validarCultura,
  type CulturaErros,
  type CulturaFormValores,
} from './validarCultura'

export default function EditarCultura() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const culturaId = Number(id)
  const idValido = Number.isInteger(culturaId) && culturaId > 0

  const [valores, setValores] = useState<CulturaFormValores>(CULTURA_VAZIA)
  const [erros, setErros] = useState<CulturaErros>({})
  const [cultura, setCultura] = useState<Cultura | null>(null)
  const [carregando, setCarregando] = useState(idValido)
  const [erro, setErro] = useState(idValido ? '' : 'Identificador de cultura inválido.')
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!idValido) return

    let ativo = true

    async function carregarCultura() {
      try {
        const dados = await culturaService.buscarPorId(culturaId)
        if (!ativo) return

        setCultura(dados)
        setValores({
          nome: dados.nome,
          variedade: dados.variedade ?? '',
          descricao: dados.descricao ?? '',
          temperaturaMin: String(dados.temperaturaMin),
          temperaturaMax: String(dados.temperaturaMax),
          umidadeMin: String(dados.umidadeMin),
          umidadeMax: String(dados.umidadeMax),
        })
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar a cultura.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarCultura()

    return () => {
      ativo = false
    }
  }, [culturaId, idValido])

  function atualizar(campo: keyof CulturaFormValores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroGeral('')

    const { erros: errosLocais, payload } = validarCultura(valores)
    setErros(errosLocais)
    if (!payload) return

    setSalvando(true)

    try {
      await culturaService.atualizar(culturaId, payload)
      navigate(`/culturas/${culturaId}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErroGeral(error.message)
        // Erros por campo vindos do backend aparecem no campo certo.
        if (error.campos) setErros(error.campos as CulturaErros)
      } else {
        setErroGeral('Não foi possível salvar as alterações.')
      }
    } finally {
      setSalvando(false)
    }
  }

  const podeEditar = podeEscrever(usuario?.perfil)

  return (
    <AppShell section="culturas">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <PageBreadcrumb
          items={[
            { label: 'Culturas', to: '/culturas' },
            {
              label: cultura?.nome || 'Cultura',
              to: `/culturas/${culturaId}`,
            },
            { label: 'Editar' },
          ]}
        />

        <Link
          to={`/culturas/${culturaId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para detalhes
        </Link>

        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <div className="flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E] sm:flex">
                <Sprout size={22} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Editar cultura
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Atualize as informações de {cultura?.nome || 'sua cultura'} e
                  salve as alterações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {carregando ? (
          <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
            <div className="text-center" role="status">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />

              <p className="mt-4 text-sm text-[#6d7a72]">
                Carregando cultura...
              </p>
            </div>
          </div>
        ) : erro ? (
          <FeedbackMessage variant="error">{erro}</FeedbackMessage>
        ) : !podeEditar ? (
          <FeedbackMessage variant="info">
            Seu perfil não tem permissão para editar culturas.
          </FeedbackMessage>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm sm:p-8"
          >
            {erroGeral ? (
              <div className="mb-5">
                <FeedbackMessage variant="error">{erroGeral}</FeedbackMessage>
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nome"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Nome da cultura
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={valores.nome}
                  onChange={(e) => atualizar('nome', e.target.value)}
                  aria-invalid={Boolean(erros.nome)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
                <ErroCampo id="nome" mensagem={erros.nome} />
              </div>

              <div>
                <label
                  htmlFor="variedade"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Variedade da cultura
                </label>

                <input
                  id="variedade"
                  name="variedade"
                  type="text"
                  value={valores.variedade}
                  onChange={(e) => atualizar('variedade', e.target.value)}
                  aria-invalid={Boolean(erros.variedade)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
                <ErroCampo id="variedade" mensagem={erros.variedade} />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="descricao"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Descrição da cultura
                </label>

                <textarea
                  id="descricao"
                  name="descricao"
                  value={valores.descricao}
                  onChange={(e) => atualizar('descricao', e.target.value)}
                  aria-invalid={Boolean(erros.descricao)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
                <ErroCampo id="descricao" mensagem={erros.descricao} />
              </div>

              {/* Bloco de Faixa Térmica */}
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/35 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700">
                    <Thermometer size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1c2922]">
                      Faixa térmica ideal
                    </h2>
                    <p className="text-xs text-[#68756d]">
                      Limites de temperatura para alertas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="temperaturaMin"
                      className="text-xs font-semibold text-[#334139]"
                    >
                      Mínima
                    </label>

                    <div className="relative mt-1.5">
                      <input
                        id="temperaturaMin"
                        name="temperaturaMin"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 20"
                        value={valores.temperaturaMin}
                        onChange={(e) => atualizar('temperaturaMin', e.target.value)}
                        aria-invalid={Boolean(erros.temperaturaMin)}
                        className="w-full rounded-xl border border-[#dce5df] bg-white py-2.5 pl-3.5 pr-9 text-sm font-medium text-[#18251e] outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7a8980]">
                        °C
                      </span>
                    </div>
                    <ErroCampo id="temperaturaMin" mensagem={erros.temperaturaMin} />
                  </div>

                  <div>
                    <label
                      htmlFor="temperaturaMax"
                      className="text-xs font-semibold text-[#334139]"
                    >
                      Máxima
                    </label>

                    <div className="relative mt-1.5">
                      <input
                        id="temperaturaMax"
                        name="temperaturaMax"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 35"
                        value={valores.temperaturaMax}
                        onChange={(e) => atualizar('temperaturaMax', e.target.value)}
                        aria-invalid={Boolean(erros.temperaturaMax)}
                        className="w-full rounded-xl border border-[#dce5df] bg-white py-2.5 pl-3.5 pr-9 text-sm font-medium text-[#18251e] outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7a8980]">
                        °C
                      </span>
                    </div>
                    <ErroCampo id="temperaturaMax" mensagem={erros.temperaturaMax} />
                  </div>
                </div>
              </div>

              {/* Bloco de Umidade Relativa */}
              <div className="rounded-2xl border border-sky-200/70 bg-sky-50/35 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/80 text-sky-700">
                    <Droplets size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1c2922]">
                      Umidade relativa ideal
                    </h2>
                    <p className="text-xs text-[#68756d]">
                      Intervalo hídrico recomendado
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="umidadeMin"
                      className="text-xs font-semibold text-[#334139]"
                    >
                      Mínima
                    </label>

                    <div className="relative mt-1.5">
                      <input
                        id="umidadeMin"
                        name="umidadeMin"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 55"
                        value={valores.umidadeMin}
                        onChange={(e) => atualizar('umidadeMin', e.target.value)}
                        aria-invalid={Boolean(erros.umidadeMin)}
                        className="w-full rounded-xl border border-[#dce5df] bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#18251e] outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7a8980]">
                        %
                      </span>
                    </div>
                    <ErroCampo id="umidadeMin" mensagem={erros.umidadeMin} />
                  </div>

                  <div>
                    <label
                      htmlFor="umidadeMax"
                      className="text-xs font-semibold text-[#334139]"
                    >
                      Máxima
                    </label>

                    <div className="relative mt-1.5">
                      <input
                        id="umidadeMax"
                        name="umidadeMax"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 80"
                        value={valores.umidadeMax}
                        onChange={(e) => atualizar('umidadeMax', e.target.value)}
                        aria-invalid={Boolean(erros.umidadeMax)}
                        className="w-full rounded-xl border border-[#dce5df] bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#18251e] outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7a8980]">
                        %
                      </span>
                    </div>
                    <ErroCampo id="umidadeMax" mensagem={erros.umidadeMax} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e8eee9] pt-6 sm:flex-row sm:justify-end">
              <Link
                to={`/culturas/${culturaId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e2db] bg-white px-5 text-sm font-semibold text-[#334139] transition hover:bg-[#f5f8f6]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008642] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? (
                  <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                ) : null}
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}