import { AlertDialog } from '@base-ui/react/alert-dialog'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { formatarData } from '@/lib/formatar'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import type { Lote, PropriedadeResumo } from '@/types/api'

import { rotuloSituacao } from './situacoes'

const ITENS_POR_PAGINA = 15

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function Lotes() {
  const { usuario } = useAuth()
  const podeEditar = podeEscrever(usuario?.perfil)

  const [lotes, setLotes] = useState<Lote[]>([])
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Filtros e paginação
  const [busca, setBusca] = useState('')
  const [filtroPropriedade, setFiltroPropriedade] = useState<string>('TODAS')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('TODAS')
  const [paginaAtual, setPaginaAtual] = useState(1)

  // Controle de exclusão via AlertDialog (incluindo fluxo 409 com sensores ativos)
  const [loteParaExcluir, setLoteParaExcluir] = useState<Lote | null>(null)
  const [sensoresAtivosConflito, setSensoresAtivosConflito] = useState<number | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const [listaLotes, listaPropriedades] = await Promise.all([
          loteService.listar(),
          propriedadeService.listar().catch(() => [] as PropriedadeResumo[]),
        ])
        if (!ativo) return
        setLotes(listaLotes)
        setPropriedades(listaPropriedades)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar os lotes.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregar()

    return () => {
      ativo = false
    }
  }, [])

  const mapaPropriedades = useMemo(() => {
    const mapa = new Map<number, string>()
    for (const p of propriedades) {
      mapa.set(p.id, p.nome)
    }
    return mapa
  }, [propriedades])

  function nomeDaPropriedade(propriedadeId: number) {
    return mapaPropriedades.get(propriedadeId) ?? `Propriedade #${propriedadeId}`
  }

  // Opções únicas de situação presentes nos lotes
  const situacoesDisponiveis = useMemo(() => {
    const unicas = new Set<string>()
    for (const l of lotes) {
      if (l.situacao) unicas.add(l.situacao)
    }
    return Array.from(unicas)
  }, [lotes])

  // KPIs consolidados
  const indicadores = useMemo(() => {
    let areaTotal = 0
    let emProducao = 0
    let sensoresAtivos = 0

    for (const l of lotes) {
      areaTotal += Number(l.area) || 0
      sensoresAtivos += Number(l.totalSensores) || 0
      if (l.situacao === 'EM_PRODUCAO') emProducao++
    }

    return {
      total: lotes.length,
      areaTotal,
      emProducao,
      sensoresAtivos,
    }
  }, [lotes])

  // Filtragem client-side
  const lotesFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return lotes.filter((lote) => {
      if (
        filtroPropriedade !== 'TODAS' &&
        String(lote.propriedadeId) !== filtroPropriedade
      ) {
        return false
      }

      if (filtroSituacao !== 'TODAS' && lote.situacao !== filtroSituacao) {
        return false
      }

      if (termo) {
        const texto = normalizarTexto(
          `${lote.identificacao} ${nomeDaPropriedade(lote.propriedadeId)} ${lote.cultura.nome} ${lote.cultura.variedade ?? ''}`,
        )
        if (!texto.includes(termo)) return false
      }

      return true
    })
  }, [lotes, busca, filtroPropriedade, filtroSituacao, mapaPropriedades])

  // Paginação
  const totalPaginas = Math.max(
    1,
    Math.ceil(lotesFiltrados.length / ITENS_POR_PAGINA),
  )
  const paginaSegura = Math.min(paginaAtual, totalPaginas)

  const lotesPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA
    return lotesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [lotesFiltrados, paginaSegura])

  function limparFiltros() {
    setBusca('')
    setFiltroPropriedade('TODAS')
    setFiltroSituacao('TODAS')
    setPaginaAtual(1)
  }

  function abrirModalExclusao(lote: Lote) {
    setErroExclusao('')
    setMensagemSucesso('')
    setSensoresAtivosConflito(null)
    setLoteParaExcluir(lote)
  }

  function fecharModalExclusao() {
    if (excluindo) return
    setLoteParaExcluir(null)
    setSensoresAtivosConflito(null)
  }

  async function confirmarExclusao(forcarDesativacaoSensores = false) {
    if (!loteParaExcluir || excluindo) return

    const alvo = loteParaExcluir
    setExcluindo(true)
    setErroExclusao('')

    try {
      await loteService.remover(alvo.id, forcarDesativacaoSensores)

      setLotes((atuais) => atuais.filter((item) => item.id !== alvo.id))
      setLoteParaExcluir(null)
      setSensoresAtivosConflito(null)
      setMensagemSucesso(`Lote "${alvo.identificacao}" excluído com sucesso.`)
    } catch (error) {
      if (
        !forcarDesativacaoSensores &&
        error instanceof ApiError &&
        error.status === 409
      ) {
        const total = Number(error.dados?.totalSensores ?? 0)
        setSensoresAtivosConflito(total)
      } else {
        setErroExclusao(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível excluir o lote.',
        )
        setLoteParaExcluir(null)
        setSensoresAtivosConflito(null)
      }
    } finally {
      setExcluindo(false)
    }
  }

  const temFiltroAtivo =
    busca.trim() !== '' ||
    filtroPropriedade !== 'TODAS' ||
    filtroSituacao !== 'TODAS'

  return (
    <AppShell section="lotes">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(1.85rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Lotes de Cultivo
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre, filtre e acompanhe os talhões, culturas implantadas e
                sensores vinculados por propriedade.
              </p>
            </div>

            {podeEditar ? (
              <Link
                to="/lotes/novo"
                className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Plus size={18} aria-hidden="true" />
                Adicionar lote
              </Link>
            ) : null}
          </div>
        </section>

        {/* KPIs de resumo */}
        {!carregando && !erro && (
          <section
            aria-label="Resumo de lotes"
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total de lotes
                </span>
                <MapPin size={16} className="text-[#009B4D]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {indicadores.total}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Área cultivada
                </span>
                <Layers size={16} className="text-[#009B4D]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {indicadores.areaTotal.toLocaleString('pt-BR', {
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-sm font-medium text-[#68756d]">ha</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Em produção
                </span>
                <Sprout size={16} className="text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {indicadores.emProducao}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Sensores ativos
                </span>
                <Cpu size={16} className="text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {indicadores.sensoresAtivos}
              </p>
            </div>
          </section>
        )}

        {/* Área principal da listagem */}
        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm"
          aria-labelledby="lotes-list-title"
        >
          {/* Barra de filtros */}
          <div className="border-b border-[#edf1ee] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2
                  id="lotes-list-title"
                  className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
                >
                  Lotes cadastrados
                </h2>
                {!carregando && !erro && (
                  <p className="mt-0.5 text-xs text-[#718078]">
                    {lotesFiltrados.length}{' '}
                    {lotesFiltrados.length === 1
                      ? 'lote exibido'
                      : 'lotes exibidos'}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Busca */}
                <div className="relative min-w-[240px] flex-1 sm:w-64">
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a8980]"
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value)
                      setPaginaAtual(1)
                    }}
                    placeholder="Buscar lote, fazenda ou cultura..."
                    aria-label="Buscar lote, fazenda ou cultura"
                    className="h-10 w-full rounded-xl border border-[#d9e2db] bg-white pl-9 pr-8 text-sm text-[#1f2d25] placeholder:text-[#86948c] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                  />
                  {busca && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusca('')
                        setPaginaAtual(1)
                      }}
                      aria-label="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#7a8980] hover:bg-[#f3f6f4] hover:text-[#1f2d25]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtro por Propriedade */}
                {propriedades.length > 0 && (
                  <select
                    value={filtroPropriedade}
                    onChange={(e) => {
                      setFiltroPropriedade(e.target.value)
                      setPaginaAtual(1)
                    }}
                    aria-label="Filtrar por propriedade"
                    className="h-10 max-w-full rounded-xl border border-[#d9e2db] bg-white px-3 text-sm font-medium text-[#334139] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15 sm:max-w-[220px]"
                  >
                    <option value="TODAS">Propriedade: Todas</option>
                    {propriedades.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                )}

                {/* Filtro por Situação */}
                <select
                  value={filtroSituacao}
                  onChange={(e) => {
                    setFiltroSituacao(e.target.value)
                    setPaginaAtual(1)
                  }}
                  aria-label="Filtrar por situação"
                  className="h-10 rounded-xl border border-[#d9e2db] bg-white px-3 text-sm font-medium text-[#334139] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                >
                  <option value="TODAS">Situação: Todas</option>
                  {situacoesDisponiveis.map((sit) => (
                    <option key={sit} value={sit}>
                      {rotuloSituacao(sit as Lote['situacao'])}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Feedbacks */}
          {(mensagemSucesso || erroExclusao) && (
            <div className="space-y-3 px-4 pt-4 sm:px-6">
              {mensagemSucesso && (
                <FeedbackMessage variant="success">
                  {mensagemSucesso}
                </FeedbackMessage>
              )}
              {erroExclusao && (
                <FeedbackMessage variant="error">
                  {erroExclusao}
                </FeedbackMessage>
              )}
            </div>
          )}

          {/* Estados: Skeleton / Erro / Vazio / Tabela */}
          {carregando ? (
            <div className="divide-y divide-[#edf1ee] p-4 sm:p-6" role="status">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center justify-between py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#e8eeea]" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded bg-[#e8eeea]" />
                      <div className="h-3 w-52 rounded bg-[#f0f4f1]" />
                    </div>
                  </div>
                  <div className="hidden h-8 w-44 rounded-lg bg-[#f0f4f1] sm:block" />
                </div>
              ))}
            </div>
          ) : erro ? (
            <div className="p-4 sm:p-6">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : lotesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <MapPin size={22} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#1f2d25]">
                Nenhum lote encontrado
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#68756d]">
                {temFiltroAtivo
                  ? 'Nenhum lote corresponde aos filtros selecionados.'
                  : 'Quando um lote for cadastrado em uma propriedade, ele aparecerá aqui.'}
              </p>
              {temFiltroAtivo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabela Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf1ee] bg-[#f9fbfa] text-xs font-semibold uppercase tracking-wider text-[#6e7d74]">
                      <th className="py-3.5 pl-6 pr-4">Lote / Propriedade</th>
                      <th className="px-4 py-3.5">Cultura</th>
                      <th className="px-4 py-3.5">Área e Plantio</th>
                      <th className="px-4 py-3.5">Sensores</th>
                      <th className="px-4 py-3.5">Situação</th>
                      {podeEditar && (
                        <th className="py-3.5 pl-4 pr-6 text-right">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1ee] text-sm">
                    {lotesPaginados.map((lote) => (
                      <tr
                        key={lote.id}
                        className="transition-colors hover:bg-[#f7fbf8]"
                      >
                        {/* Lote + Propriedade */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                              <MapPin size={18} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#1f2d25]">
                                {lote.identificacao}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#68756d]">
                                {nomeDaPropriedade(lote.propriedadeId)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cultura + Variedade */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#25332b]">
                            {lote.cultura.nome}
                          </p>
                          {lote.cultura.variedade && (
                            <p className="mt-0.5 text-xs text-[#68756d]">
                              Var. {lote.cultura.variedade}
                            </p>
                          )}
                        </td>

                        {/* Área e Data de Plantio */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-[#25332b]">
                            {lote.area} ha
                          </p>
                          <p className="mt-0.5 text-xs text-[#68756d]">
                            Plantio: {formatarData(lote.dataPlantacao)}
                          </p>
                        </td>

                        {/* Sensores ativos */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e0e7e2] bg-[#f8faf9] px-2.5 py-1 text-xs font-semibold text-[#334139]">
                            <Cpu
                              size={13}
                              className={
                                lote.totalSensores > 0
                                  ? 'text-[#009B4D]'
                                  : 'text-[#8a9890]'
                              }
                            />
                            {lote.totalSensores}{' '}
                            {lote.totalSensores === 1 ? 'ativo' : 'ativos'}
                          </span>
                        </td>

                        {/* Situação */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              lote.situacao === 'EM_PRODUCAO'
                                ? 'bg-[#edf7f1] text-[#15693E]'
                                : 'bg-[#FFF9E8] text-[#9A7000]'
                            }`}
                          >
                            {rotuloSituacao(lote.situacao)}
                          </span>
                        </td>

                        {/* Ações */}
                        {podeEditar && (
                          <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Link
                                to={`/lotes/${lote.id}/editar`}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9A31A] bg-white px-3 text-xs font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
                              >
                                <Pencil size={13} aria-hidden="true" />
                                Editar
                              </Link>

                              <button
                                type="button"
                                onClick={() => abrirModalExclusao(lote)}
                                className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E57373] bg-white px-3 text-xs font-semibold text-[#C62828] transition hover:bg-[#FFF5F5]"
                              >
                                <Trash2 size={13} aria-hidden="true" />
                                Excluir
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lista Compacta Mobile / Tablet */}
              <div className="divide-y divide-[#edf1ee] lg:hidden">
                {lotesPaginados.map((lote) => (
                  <article key={lote.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                          <MapPin size={18} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-[#1f2d25]">
                            {lote.identificacao}
                          </h3>
                          <p className="truncate text-xs text-[#68756d]">
                            {nomeDaPropriedade(lote.propriedadeId)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lote.situacao === 'EM_PRODUCAO'
                            ? 'bg-[#edf7f1] text-[#15693E]'
                            : 'bg-[#FFF9E8] text-[#9A7000]'
                        }`}
                      >
                        {rotuloSituacao(lote.situacao)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#66746c]">
                      <span>
                        <strong className="font-semibold text-[#25332b]">
                          Cultura:
                        </strong>{' '}
                        {lote.cultura.nome}
                        {lote.cultura.variedade
                          ? ` (${lote.cultura.variedade})`
                          : ''}
                      </span>
                      <span>
                        <strong className="font-semibold text-[#25332b]">
                          Área:
                        </strong>{' '}
                        {lote.area} ha
                      </span>
                      <span>
                        <strong className="font-semibold text-[#25332b]">
                          Plantio:
                        </strong>{' '}
                        {formatarData(lote.dataPlantacao)}
                      </span>
                      <span>
                        <strong className="font-semibold text-[#25332b]">
                          Sensores:
                        </strong>{' '}
                        {lote.totalSensores}
                      </span>
                    </div>

                    {podeEditar && (
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Link
                          to={`/lotes/${lote.id}/editar`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9A31A] bg-white px-3 text-xs font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
                        >
                          <Pencil size={13} />
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => abrirModalExclusao(lote)}
                          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E57373] bg-white px-3 text-xs font-semibold text-[#C62828] transition hover:bg-[#FFF5F5]"
                        >
                          <Trash2 size={13} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Rodapé com Paginação */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[#edf1ee] px-4 py-3.5 text-xs text-[#68756d] sm:flex-row sm:px-6">
                <p>
                  Mostrando{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {(paginaSegura - 1) * ITENS_POR_PAGINA + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {Math.min(
                      paginaSegura * ITENS_POR_PAGINA,
                      lotesFiltrados.length,
                    )}
                  </strong>{' '}
                  de{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {lotesFiltrados.length}
                  </strong>{' '}
                  {lotesFiltrados.length === 1 ? 'lote' : 'lotes'}
                </p>

                {totalPaginas > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={paginaSegura <= 1}
                      onClick={() =>
                        setPaginaAtual((p) => Math.max(1, p - 1))
                      }
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      <ChevronLeft size={14} />
                      Anterior
                    </Button>

                    <span className="px-2 font-medium text-[#1f2d25]">
                      Página {paginaSegura} de {totalPaginas}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={paginaSegura >= totalPaginas}
                      onClick={() =>
                        setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                      }
                      className="h-8 gap-1 px-2.5 text-xs"
                    >
                      Próxima
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal de confirmação de exclusão (com suporte ao conflito 409 de sensores ativos) */}
      <AlertDialog.Root
        open={loteParaExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalExclusao()
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
            {sensoresAtivosConflito !== null ? (
              <>
                <div className="flex items-center gap-3 text-amber-700">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <AlertTriangle size={20} />
                  </span>
                  <AlertDialog.Title className="text-lg font-semibold text-[#18251e]">
                    Lote possui sensores ativos
                  </AlertDialog.Title>
                </div>

                <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
                  O lote <strong>"{loteParaExcluir?.identificacao}"</strong> tem{' '}
                  <strong>
                    {sensoresAtivosConflito}{' '}
                    {sensoresAtivosConflito === 1
                      ? 'sensor ativo'
                      : 'sensores ativos'}
                  </strong>
                  . Se continuar, o lote e esses sensores serão desativados.
                  Deseja prosseguir?
                </AlertDialog.Description>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={excluindo}
                    onClick={fecharModalExclusao}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    disabled={excluindo}
                    onClick={() => void confirmarExclusao(true)}
                  >
                    {excluindo
                      ? 'Excluindo...'
                      : 'Desativar sensores e excluir'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
                  Confirmar exclusão
                </AlertDialog.Title>

                <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
                  Tem certeza que deseja excluir o lote{' '}
                  <strong>"{loteParaExcluir?.identificacao}"</strong>? Esta ação
                  não poderá ser desfeita.
                </AlertDialog.Description>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={excluindo}
                    onClick={fecharModalExclusao}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    disabled={excluindo}
                    onClick={() => void confirmarExclusao(false)}
                  >
                    {excluindo ? 'Excluindo...' : 'Excluir lote'}
                  </Button>
                </div>
              </>
            )}
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </AppShell>
  )
}