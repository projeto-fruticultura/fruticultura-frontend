import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  AppShell,
  PageBreadcrumb,
} from '@/components/app/AppShell'

interface Cultura {
  id: number
  nome: string
  variedade: string | null
  descricao: string | null
  temperaturaMin: number
  temperaturaMax: number
  umidadeMin: number
  umidadeMax: number
}

export default function EditarCultura() {
  const { id } = useParams()
  const navigate = useNavigate()

  const culturaId = Number(id)

  const [nome, setNome] = useState('')
  const [variedade, setVariedade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [temperaturaMin, setTemperaturaMin] = useState('')
  const [temperaturaMax, setTemperaturaMax] = useState('')
  const [umidadeMin, setUmidadeMin] = useState('')
  const [umidadeMax, setUmidadeMax] = useState('')

  const [cultura, setCultura] = useState<Cultura | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!Number.isInteger(culturaId) || culturaId <= 0) {
      setErro('Identificador de cultura inválido.')
      setCarregando(false)
      return
    }

    async function carregarCultura() {
      try {
        const resposta = await fetch(
          `http://localhost:3000/api/culturas/${culturaId}`,
        )

        const dados = await resposta.json()

        if (!resposta.ok) {
          setErro(
            dados?.erro ||
              dados?.message ||
              'Não foi possível carregar a cultura.',
          )
          return
        }

        setCultura(dados)

        setNome(dados.nome)
        setVariedade(dados.variedade ?? '')
        setDescricao(dados.descricao ?? '')
        setTemperaturaMin(String(dados.temperaturaMin))
        setTemperaturaMax(String(dados.temperaturaMax))
        setUmidadeMin(String(dados.umidadeMin))
        setUmidadeMax(String(dados.umidadeMax))
      } catch (error) {
        console.error('Erro ao carregar cultura:', error)
        setErro('Não foi possível carregar a cultura.')
      } finally {
        setCarregando(false)
      }
    }

    carregarCultura()
  }, [culturaId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      const resposta = await fetch(
        `http://localhost:3000/api/culturas/${culturaId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome,
            variedade,
            descricao,
            temperaturaMin: Number(temperaturaMin),
            temperaturaMax: Number(temperaturaMax),
            umidadeMin: Number(umidadeMin),
            umidadeMax: Number(umidadeMax),
          }),
        },
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        console.error('Erro ao atualizar cultura:', dados)

        setErro(
          dados?.erro ||
            dados?.message ||
            'Não foi possível salvar as alterações.',
        )

        return
      }

      navigate(`/culturas/${culturaId}`, { replace: true })
    } catch (error) {
      console.error('Erro ao atualizar cultura:', error)
      setErro('Não foi possível salvar as alterações.')
    }
  }

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
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />

              <p className="mt-4 text-sm text-[#6d7a72]">
                Carregando cultura...
              </p>
            </div>
          </div>
        ) : erro ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {erro}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm sm:p-8"
          >
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
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
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
                  value={variedade}
                  onChange={(e) => setVariedade(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
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
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
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
                  value={temperaturaMin}
                  onChange={(e) => setTemperaturaMin(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                />
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
                  value={temperaturaMax}
                  onChange={(e) => setTemperaturaMax(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#E5A72C] focus:ring-4 focus:ring-[#E5A72C]/10 border-l-[5px] border-l-[#E5A72C]"
                />
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
                  value={umidadeMin}
                  onChange={(e) => setUmidadeMin(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                />
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
                  value={umidadeMax}
                  onChange={(e) => setUmidadeMax(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 py-3 text-sm text-[#26352d] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:border-[#39BCE5] focus:ring-4 focus:ring-[#39BCE5]/10 border-l-[5px] border-l-[#39BCE5]"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-[#e8eee9] pt-6">
              <button
                type="submit"
                className="rounded-xl bg-[#009B4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008642] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 cursor-pointer"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}