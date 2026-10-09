import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  AppShell,
  PageBreadcrumb,
} from '@/components/app/AppShell'
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

    carregarCultura()

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

        <div className="mb-6">
          <Link
            to={`/culturas/${culturaId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#15693E] transition hover:text-[#009B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar para detalhes
          </Link>

          <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
            Editar cultura
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
            Atualize as informações de {cultura?.nome || 'sua cultura'} e
            salve as alterações.
          </p>
        </div>

        {carregando ? (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-[#e1e7e3] bg-white">
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

              <div>
                <label
                  htmlFor="temperaturaMin"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Temperatura mínima (°C)
                </label>

                <input
                  id="temperaturaMin"
                  name="temperaturaMin"
                  type="number"
                  step="0.01"
                  value={valores.temperaturaMin}
                  onChange={(e) => atualizar('temperaturaMin', e.target.value)}
                  aria-invalid={Boolean(erros.temperaturaMin)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                />
                <ErroCampo id="temperaturaMin" mensagem={erros.temperaturaMin} />
              </div>

              <div>
                <label
                  htmlFor="temperaturaMax"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Temperatura máxima (°C)
                </label>

                <input
                  id="temperaturaMax"
                  name="temperaturaMax"
                  type="number"
                  step="0.01"
                  value={valores.temperaturaMax}
                  onChange={(e) => atualizar('temperaturaMax', e.target.value)}
                  aria-invalid={Boolean(erros.temperaturaMax)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                />
                <ErroCampo id="temperaturaMax" mensagem={erros.temperaturaMax} />
              </div>

              <div>
                <label
                  htmlFor="umidadeMin"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Umidade mínima (%)
                </label>

                <input
                  id="umidadeMin"
                  name="umidadeMin"
                  type="number"
                  step="0.01"
                  value={valores.umidadeMin}
                  onChange={(e) => atualizar('umidadeMin', e.target.value)}
                  aria-invalid={Boolean(erros.umidadeMin)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                />
                <ErroCampo id="umidadeMin" mensagem={erros.umidadeMin} />
              </div>

              <div>
                <label
                  htmlFor="umidadeMax"
                  className="text-sm font-semibold text-[#28372f]"
                >
                  Umidade máxima (%)
                </label>

                <input
                  id="umidadeMax"
                  name="umidadeMax"
                  type="number"
                  step="0.01"
                  value={valores.umidadeMax}
                  onChange={(e) => atualizar('umidadeMax', e.target.value)}
                  aria-invalid={Boolean(erros.umidadeMax)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                />
                <ErroCampo id="umidadeMax" mensagem={erros.umidadeMax} />
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-[#e8eee9] pt-6">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#009B4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008642] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
