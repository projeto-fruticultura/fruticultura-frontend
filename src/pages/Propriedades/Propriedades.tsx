import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Edit3,
  Eye,
  LayoutGrid,
  Leaf,
  List,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeResumo } from '@/types/api'
import { useAuth } from '@/context/AuthContext'

type ModoVisualizacao = 'lista' | 'grade'

const ITENS_POR_PAGINA_OPCOES = [15, 25, 50]

export default function Propriedades() {
  const { usuario } = useAuth()
  const somenteLeitura = usuario?.perfil === 'TECNICO'

  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [query, setQuery] = useState('')
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('lista')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(15)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [itemParaExcluir, setItemParaExcluir] = useState<PropriedadeResumo | null>(null)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setPropriedades(await propriedadeService.listar())
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar as propriedades.',
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return propriedades
    return propriedades.filter((item) =>
      `${item.nome} ${item.cidade} ${item.uf}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    )
  }, [propriedades, query])

  // Volta para a página 1 ao alterar busca ou tamanho da página
  useEffect(() => {
    setPaginaAtual(1)
  }, [query, itensPorPagina])

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / itensPorPagina))
  const paginaSegura = Math.min(paginaAtual, totalPaginas)

  const paginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * itensPorPagina
    return filtered.slice(inicio, inicio + itensPorPagina)
  }, [filtered, paginaSegura, itensPorPagina])

  const totals = useMemo(() => {
    const totalPropriedades = propriedades.length
    const totalLotes = propriedades.reduce((sum, item) => sum + item.totalLotes, 0)
    const totalSensores = propriedades.reduce((sum, item) => sum + item.totalSensores, 0)
    const mediaLotes =
      totalPropriedades > 0 ? (totalLotes / totalPropriedades).toFixed(1) : '0.0'

    return {
      propriedades: totalPropriedades,
      lotes: totalLotes,
      sensores: totalSensores,
      mediaLotes,
    }
  }, [propriedades])

  async function confirmarRemocao() {
    if (!itemParaExcluir) return

    const alvo = itemParaExcluir
    setItemParaExcluir(null)
    setExcluindoId(alvo.id)
    setErro('')
    setSucesso('')

    try {
      await propriedadeService.remover(alvo.id)
      setSucesso(`Propriedade “${alvo.nome}” removida com sucesso.`)
      await carregar()
    } catch (error) {
      setErro(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível remover a propriedade.',
      )
    } finally {
      setExcluindoId(null)
    }
  }

  const indiceInicial = filtered.length === 0 ? 0 : (paginaSegura - 1) * itensPorPagina + 1
  const indiceFinal = Math.min(paginaSegura * itensPorPagina, filtered.length)

  return (
    <AppShell section="properties">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho padronizado sem título extra acima do H1 */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                  Propriedades
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                  Cadastre, consulte e gerencie as unidades produtivas, lotes e
                  sensores da operação.
                </p>
              </div>
            </div>

            {!somenteLeitura && (
              <Link
                to="/propriedades/nova"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Plus size={18} aria-hidden="true" />
                Adicionar propriedade
              </Link>
            )}
          </div>
        </section>

        {/* Indicadores executivos */}
        <section
          className="mt-5 grid gap-4 sm:grid-cols-3"
          aria-label="Resumo de propriedades"
        >
          <SummaryCard
            label="Propriedades ativas"
            value={totals.propriedades}
            sublabel="Unidades cadastradas"
            icon={Building2}
          />
          <SummaryCard
            label="Lotes cadastrados"
            value={totals.lotes}
            sublabel={`Média de ${totals.mediaLotes} por propriedade`}
            icon={Leaf}
          />
          <SummaryCard
            label="Sensores vinculados"
            value={totals.sensores}
            sublabel="Dispositivos na rede"
            icon={Cpu}
          />
        </section>

        {sucesso ? (
          <div className="mt-5">
            <FeedbackMessage variant="success">{sucesso}</FeedbackMessage>
          </div>
        ) : null}
        {erro ? (
          <div className="mt-5">
            <FeedbackMessage variant="error">{erro}</FeedbackMessage>
          </div>
        ) : null}

        {/* Listagem paginada e escalável */}
        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="properties-list-title"
        >
          <div className="flex flex-col gap-4 border-b border-[#edf1ee] pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2
                id="properties-list-title"
                className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
              >
                Propriedades cadastradas
              </h2>
              <p className="mt-1 text-sm text-[#718078]">
                {filtered.length}{' '}
                {filtered.length === 1
                  ? 'propriedade encontrada'
                  : 'propriedades encontradas'}
                {query.trim() ? ` para “${query.trim()}”` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="relative block min-w-0 flex-1 sm:w-[280px] sm:flex-initial">
                <span className="sr-only">Buscar propriedades</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#819087]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome, cidade ou UF"
                  className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] pl-10 pr-4 text-sm outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
                />
              </label>

              <div
                className="inline-flex rounded-xl border border-[#dce5df] bg-[#f5f8f6] p-1"
                role="group"
                aria-label="Modo de visualização"
              >
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('lista')}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                    modoVisualizacao === 'lista'
                      ? 'bg-white text-[#15693E] shadow-xs'
                      : 'text-[#5b6961] hover:text-[#1c2922]'
                  }`}
                >
                  <List size={15} aria-hidden="true" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('grade')}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                    modoVisualizacao === 'grade'
                      ? 'bg-white text-[#15693E] shadow-xs'
                      : 'text-[#5b6961] hover:text-[#1c2922]'
                  }`}
                >
                  <LayoutGrid size={15} aria-hidden="true" />
                  Grade
                </button>
              </div>

              <button
                type="button"
                onClick={() => void carregar()}
                disabled={carregando}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#425147] transition hover:bg-[#f4f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  size={17}
                  className={carregando ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
                Atualizar
              </button>
            </div>
          </div>

          {carregando ? (
            <div
              className="grid min-h-[310px] place-items-center"
              role="status"
              aria-live="polite"
            >
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009B4D]/18 border-t-[#009B4D]" />
                <p className="mt-4 text-sm font-medium text-[#67746c]">
                  Carregando propriedades...
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <Leaf size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-[#28372f]">
                Nenhuma propriedade encontrada
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#748078]">
                {query
                  ? 'Ajuste o termo de busca ou limpe o filtro para visualizar outras propriedades.'
                  : 'Cadastre a primeira propriedade para começar a organizar lotes e sensores.'}
              </p>
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#334139] transition hover:bg-[#f4f8f5] cursor-pointer"
                >
                  Limpar busca
                </button>
              ) : !somenteLeitura ? (
                <Link
                  to="/propriedades/nova"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#009B4D] px-4 text-sm font-semibold text-white hover:bg-[#008844]"
                >
                  <Plus size={17} />
                  Adicionar propriedade
                </Link>
              ) : null}
            </div>
          ) : modoVisualizacao === 'lista' ? (
            /* Lista densa e leve para grandes volumes */
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#e3eae5]">
              <div className="divide-y divide-[#edf1ee] bg-white">
                {paginados.map((item) => {
                  const emRemocao = excluindoId === item.id
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-[#f7faf8] sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="truncate text-sm font-semibold text-[#1b2821] sm:text-[15px]">
                            {item.nome}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs text-[#66746c]">
                            <MapPin
                              size={13}
                              className="shrink-0 text-[#009B4D]"
                              aria-hidden="true"
                            />
                            {item.cidade} - {item.uf}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                        <div className="flex items-center gap-2 text-xs text-[#4a5950]">
                          <span className="rounded-lg bg-[#f3f7f4] px-2.5 py-1 font-medium">
                            <strong className="font-semibold text-[#18251e]">
                              {item.totalLotes}
                            </strong>{' '}
                            lotes
                          </span>
                          <span className="rounded-lg bg-[#edf7f1] px-2.5 py-1 font-medium text-[#15693E]">
                            <strong className="font-semibold">
                              {item.totalSensores}
                            </strong>{' '}
                            sensores
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/propriedades/${item.id}`}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#c7e3d2] bg-white px-3 text-xs font-semibold text-[#15693E] transition hover:bg-[#edf8f1]"
                          >
                            <Eye size={14} aria-hidden="true" />
                            Detalhes
                          </Link>

                          {!somenteLeitura && (
                            <>
                              <Link
                                to={`/propriedades/${item.id}/editar`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3c878] bg-[#fffdf7] text-[#8f6700] transition hover:bg-[#fff6dc]"
                                aria-label={`Editar ${item.nome}`}
                                title={`Editar ${item.nome}`}
                              >
                                <Edit3 size={15} aria-hidden="true" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setItemParaExcluir(item)}
                                disabled={emRemocao}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                aria-label={`Excluir ${item.nome}`}
                                title={`Excluir ${item.nome}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Grade paginada */
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginados.map((item) => {
                const emRemocao = excluindoId === item.id
                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#dfe6e1] bg-[#fcfdfb] p-4 transition hover:border-[#b7d4c3] hover:bg-white sm:p-5"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[#1d2b23]">
                        {item.nome}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#66746c] sm:text-sm">
                        <MapPin
                          size={14}
                          className="shrink-0 text-[#009B4D]"
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {item.cidade} - {item.uf}
                        </span>
                      </p>

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <MetricChip
                          label="Lotes"
                          value={item.totalLotes}
                          dotClass="bg-[#009B4D]"
                        />
                        <MetricChip
                          label="Sensores"
                          value={item.totalSensores}
                          dotClass="bg-[#1b8868]"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-4">
                      <Link
                        to={`/propriedades/${item.id}`}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#c3e2cf] bg-white px-3 text-xs font-semibold text-[#15693E] transition hover:bg-[#edf8f1]"
                      >
                        <Eye size={15} aria-hidden="true" />
                        Ver detalhes
                      </Link>

                      {!somenteLeitura && (
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/propriedades/${item.id}/editar`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3c878] bg-[#fffdf7] text-[#8f6700] transition hover:bg-[#fff6dc]"
                            aria-label={`Editar ${item.nome}`}
                            title={`Editar ${item.nome}`}
                          >
                            <Edit3 size={15} aria-hidden="true" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setItemParaExcluir(item)}
                            disabled={emRemocao}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            aria-label={`Excluir ${item.nome}`}
                            title={`Excluir ${item.nome}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Barra de paginação para escalar em grandes bases */}
          {!carregando && filtered.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-[#edf1ee] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#68756d]">
                <span>
                  Mostrando <strong className="text-[#18251e]">{indiceInicial}</strong>–
                  <strong className="text-[#18251e]">{indiceFinal}</strong> de{' '}
                  <strong className="text-[#18251e]">{filtered.length}</strong>
                </span>

                <label className="inline-flex items-center gap-1.5">
                  <span>Por página:</span>
                  <select
                    value={itensPorPagina}
                    onChange={(e) => setItensPorPagina(Number(e.target.value))}
                    className="rounded-lg border border-[#dce5df] bg-[#fbfdfb] px-2 py-1 text-xs font-semibold text-[#28372f] outline-none focus:border-[#009B4D]"
                  >
                    {ITENS_POR_PAGINA_OPCOES.map((qtd) => (
                      <option key={qtd} value={qtd}>
                        {qtd}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaSegura <= 1}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#dce5df] bg-white px-3 text-xs font-semibold text-[#334139] transition hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Anterior
                </button>

                <span className="px-2 text-xs font-semibold text-[#435249]">
                  Página {paginaSegura} de {totalPaginas}
                </span>

                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura >= totalPaginas}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#dce5df] bg-white px-3 text-xs font-semibold text-[#334139] transition hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                >
                  Próxima
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* Modal de confirmação de exclusão lógica */}
      {itemParaExcluir ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-excluir-propriedade-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="modal-excluir-propriedade-titulo"
                  className="text-lg font-semibold text-[#18251e]"
                >
                  Remover propriedade?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="rounded-lg p-1.5 text-[#68756d] transition hover:bg-[#f3f6f4] hover:text-[#18251e] cursor-pointer"
                aria-label="Fechar janela de confirmação"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#5f6d65]">
              Tem certeza de que deseja remover a propriedade{' '}
              <strong className="font-semibold text-[#18251e]">
                {itemParaExcluir.nome}
              </strong>{' '}
              ({itemParaExcluir.cidade} - {itemParaExcluir.uf})? Esta ação realizará
              uma exclusão lógica.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#3f4e45] transition hover:bg-[#f4f8f5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarRemocao()}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
              >
                Confirmar remoção
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

function SummaryCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string
  value: number
  sublabel: string
  icon: typeof Building2
}) {
  return (
    <div className="rounded-2xl border border-[#e1e7e3] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6e7b73]">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-[#15693E]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#7c8981]">{sublabel}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function MetricChip({
  label,
  value,
  dotClass,
}: {
  label: string
  value: number
  dotClass: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3eae5] bg-[#f4f8f5] px-3 py-1.5 text-xs font-medium text-[#435249]">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      <strong className="font-semibold text-[#18251e]">{value}</strong>{' '}
      {label.toLocaleLowerCase('pt-BR')}
    </span>
  )
}