import { AlertDialog } from '@base-ui/react/alert-dialog'
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Cpu,
  Droplets,
  FolderTree,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  Thermometer,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Diagnostico from './Diagnostico'
import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { formatarData } from '@/lib/formatar'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { sensorService } from '@/services/sensorService'
import type { Sensor } from '@/types/api'

import { rotuloTipoSensor } from './tiposSensor'

type ModoExibicao = 'cards' | 'lotes' | 'tabela'

const CARDS_POR_PAGINA = 18
const LOTES_POR_PAGINA = 6
const LINHAS_POR_PAGINA = 25

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterEstiloTipoSensor(tipo: Sensor['tipo']) {
  const rotulo = rotuloTipoSensor(tipo)
  const tipoNorm = normalizarTexto(String(tipo))

  if (
    tipoNorm.includes('umidade') ||
    tipoNorm.includes('solo') ||
    tipoNorm.includes('chuva')
  ) {
    return {
      rotulo,
      Icone: Droplets,
      bgIcone: 'bg-sky-50 text-sky-700 border-sky-200',
      faixaCor: 'bg-sky-500',
    }
  }

  if (
    tipoNorm.includes('temp') ||
    tipoNorm.includes('clima') ||
    tipoNorm.includes('radiacao')
  ) {
    return {
      rotulo,
      Icone: Thermometer,
      bgIcone: 'bg-amber-50 text-amber-700 border-amber-200',
      faixaCor: 'bg-amber-500',
    }
  }

  return {
    rotulo,
    Icone: Activity,
    bgIcone: 'bg-[#edf7f1] text-[#15693E] border-emerald-200',
    faixaCor: 'bg-[#009B4D]',
  }
}

export default function Sensores() {
  const { usuario } = useAuth()

  if (usuario?.perfil === 'TECNICO') {
    return <Diagnostico />
  }

  return <ListaSensores />
}

function ListaSensores() {
  const { usuario } = useAuth()
  const podeEditar = podeEscrever(usuario?.perfil)

  const [sensores, setSensores] = useState<Sensor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Filtros, visualização e paginação (suporta milhares de sensores)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroLote, setFiltroLote] = useState<string>('TODOS')
  const [modoExibicao, setModoExibicao] = useState<ModoExibicao>('cards')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [codigoCopiadoId, setCodigoCopiadoId] = useState<number | null>(null)

  // Modal de exclusão
  const [sensorParaExcluir, setSensorParaExcluir] = useState<Sensor | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarSensores() {
      try {
        const dados = await sensorService.listar()
        if (ativo) setSensores(dados)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar os sensores.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarSensores()

    return () => {
      ativo = false
    }
  }, [])

  const tiposDisponiveis = useMemo(() => {
    const unicos = new Set<string>()
    for (const s of sensores) {
      if (s.tipo) unicos.add(String(s.tipo))
    }
    return Array.from(unicos)
  }, [sensores])

  const lotesDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>()
    for (const s of sensores) {
      if (s.lote?.id && s.lote?.identificacao) {
        mapa.set(s.lote.id, s.lote.identificacao)
      }
    }
    return Array.from(mapa.entries()).map(([id, identificacao]) => ({
      id,
      identificacao,
    }))
  }, [sensores])

  const sensoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return sensores.filter((sensor) => {
      if (filtroTipo !== 'TODOS' && String(sensor.tipo) !== filtroTipo) {
        return false
      }

      if (filtroLote !== 'TODOS' && String(sensor.lote?.id) !== filtroLote) {
        return false
      }

      if (termo) {
        const texto = normalizarTexto(
          `${sensor.codigo} ${rotuloTipoSensor(sensor.tipo)} ${sensor.lote?.identificacao ?? ''} ${sensor.localizacao ?? ''}`,
        )
        if (!texto.includes(termo)) return false
      }

      return true
    })
  }, [sensores, busca, filtroTipo, filtroLote])

  // Agrupamento por Lote
  const gruposPorLote = useMemo(() => {
    const mapa = new Map<string, { loteNome: string; itens: Sensor[] }>()

    for (const sensor of sensoresFiltrados) {
      const chave = String(sensor.lote?.id ?? 'sem-lote')
      const loteNome = sensor.lote?.identificacao ?? 'Sem lote vinculado'
      const grupoAtual = mapa.get(chave)

      if (grupoAtual) {
        grupoAtual.itens.push(sensor)
      } else {
        mapa.set(chave, { loteNome, itens: [sensor] })
      }
    }

    return Array.from(mapa.entries()).map(([id, grupo]) => ({
      id,
      ...grupo,
    }))
  }, [sensoresFiltrados])

  // Paginação adaptativa conforme o modo de exibição
  const totalItensPaginaveis =
    modoExibicao === 'lotes' ? gruposPorLote.length : sensoresFiltrados.length

  const itensPorPagina =
    modoExibicao === 'lotes'
      ? LOTES_POR_PAGINA
      : modoExibicao === 'tabela'
        ? LINHAS_POR_PAGINA
        : CARDS_POR_PAGINA

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalItensPaginaveis / itensPorPagina),
  )
  const paginaSegura = Math.min(paginaAtual, totalPaginas)

  const sensoresPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * itensPorPagina
    return sensoresFiltrados.slice(inicio, inicio + itensPorPagina)
  }, [sensoresFiltrados, paginaSegura, itensPorPagina])

  const gruposPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * LOTES_POR_PAGINA
    return gruposPorLote.slice(inicio, inicio + LOTES_POR_PAGINA)
  }, [gruposPorLote, paginaSegura])

  function alterarModoExibicao(novoModo: ModoExibicao) {
    setModoExibicao(novoModo)
    setPaginaAtual(1)
  }

  function limparFiltros() {
    setBusca('')
    setFiltroTipo('TODOS')
    setFiltroLote('TODOS')
    setPaginaAtual(1)
  }

  async function copiarCodigo(sensor: Sensor) {
    try {
      await navigator.clipboard.writeText(sensor.codigo)
      setCodigoCopiadoId(sensor.id)
      setTimeout(() => {
        setCodigoCopiadoId((atual) => (atual === sensor.id ? null : atual))
      }, 1800)
    } catch {
      // Ignora caso o navegador bloqueie clipboard sem foco
    }
  }

  async function confirmarExclusao() {
    if (!sensorParaExcluir || excluindo) return

    const alvo = sensorParaExcluir
    setExcluindo(true)
    setErroExclusao('')
    setMensagemSucesso('')

    try {
      await sensorService.remover(alvo.id)
      setSensores((atuais) => atuais.filter((item) => item.id !== alvo.id))
      setSensorParaExcluir(null)
      setMensagemSucesso(`Sensor "${alvo.codigo}" removido com sucesso.`)
    } catch (error) {
      setErroExclusao(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível excluir o sensor.',
      )
      setSensorParaExcluir(null)
    } finally {
      setExcluindo(false)
    }
  }

  function renderCardHardware(sensor: Sensor) {
    const { rotulo, Icone, bgIcone, faixaCor } = obterEstiloTipoSensor(
      sensor.tipo,
    )

    return (
      <article
        key={sensor.id}
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#dfe6e1] bg-white p-5 shadow-[0_2px_10px_rgba(24,37,30,.03)] transition hover:border-[#c3d5ca] hover:shadow-[0_12px_28px_rgba(31,41,51,.07)]"
      >
        {/* Faixa superior consistente */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-1 ${faixaCor}`}
        />

        <div>
          {/* Topo do módulo: Serial + Telemetria */}
          <div className="flex items-center justify-between gap-2 border-b border-[#f0f4f1] pb-3.5">
            <div className="flex items-center gap-1.5">
              <code className="rounded-lg border border-[#e0e7e2] bg-[#f7faf8] px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-[#18251e]">
                {sensor.codigo}
              </code>

              <button
                type="button"
                onClick={() => void copiarCodigo(sensor)}
                title="Copiar código serial"
                aria-label={`Copiar código do sensor ${sensor.codigo}`}
                className="rounded-lg p-1.5 text-[#8a9890] transition hover:bg-[#edf7f1] hover:text-[#15693E]"
              >
                {codigoCopiadoId === sensor.id ? (
                  <Check size={14} className="text-[#009B4D]" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              Online
            </span>
          </div>

          {/* Leitura / Tipo de Sensor */}
          <div className="mt-4 flex items-center gap-3.5">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${bgIcone}`}
            >
              <Icone size={21} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7a8980]">
                Variável monitorada
              </p>
              <h3 className="truncate text-base font-semibold text-[#1c2922]">
                {rotulo}
              </h3>
            </div>
          </div>

          {/* Especificações de Campo */}
          <dl className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-[#f8faf9] p-3 text-xs">
            <div>
              <dt className="text-[#7a8980]">Lote vinculado</dt>
              <dd className="mt-0.5 truncate font-semibold text-[#25332b]">
                {sensor.lote.identificacao}
              </dd>
            </div>

            <div>
              <dt className="text-[#7a8980]">Instalação</dt>
              <dd className="mt-0.5 font-semibold text-[#25332b]">
                {formatarData(sensor.dataInstalacao)}
              </dd>
            </div>

            <div className="col-span-2 border-t border-[#ebf0ed] pt-2">
              <dt className="text-[#7a8980]">Ponto de instalação</dt>
              <dd className="mt-0.5 truncate font-medium text-[#334139]">
                {sensor.localizacao || 'Localização padrão no talhão'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Rodapé de Ações */}
        {podeEditar ? (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#f0f4f1] pt-3.5">
            <Link
              to={`/sensores/${sensor.id}/editar`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9A31A] bg-white px-3 text-xs font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
            >
              <Pencil size={13} aria-hidden="true" />
              Editar
            </Link>

            <button
              type="button"
              onClick={() => setSensorParaExcluir(sensor)}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E57373] bg-white px-3 text-xs font-semibold text-[#C62828] transition hover:bg-[#FFF5F5]"
            >
              <Trash2 size={13} aria-hidden="true" />
              Excluir
            </button>
          </div>
        ) : null}
      </article>
    )
  }

  const temFiltroAtivo =
    busca.trim() !== '' || filtroTipo !== 'TODOS' || filtroLote !== 'TODOS'

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho limpo */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Sensores
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie os sensores utilizados no monitoramento da
                produção.
              </p>
            </div>

            {podeEditar ? (
              <Link
                to="/sensores/novo"
                className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
              >
                <Plus size={18} aria-hidden="true" />
                Adicionar sensor
              </Link>
            ) : null}
          </div>
        </section>

        {/* Painel de Dispositivos IoT */}
        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="sensores-list-title"
        >
          {/* Barra de controle */}
          <div className="flex flex-col gap-4 border-b border-[#edf1ee] pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2
                id="sensores-list-title"
                className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
              >
                Dispositivos instalados
              </h2>

              {!carregando && !erro ? (
                <p className="mt-1 text-sm text-[#718078]">
                  {sensoresFiltrados.length.toLocaleString('pt-BR')}{' '}
                  {sensoresFiltrados.length === 1
                    ? 'sensor ativo na rede'
                    : 'sensores ativos na rede'}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Busca */}
              <div className="relative min-w-[230px] flex-1 sm:w-60">
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
                  placeholder="Buscar código, lote ou local..."
                  aria-label="Buscar sensor por código, lote ou localização"
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

              {/* Filtro por Tipo */}
              {tiposDisponiveis.length > 0 && (
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value)
                    setPaginaAtual(1)
                  }}
                  aria-label="Filtrar por tipo de sensor"
                  className="h-10 rounded-xl border border-[#d9e2db] bg-white px-3 text-sm font-medium text-[#334139] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                >
                  <option value="TODOS">Tipo: Todos</option>
                  {tiposDisponiveis.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {rotuloTipoSensor(tipo as Sensor['tipo'])}
                    </option>
                  ))}
                </select>
              )}

              {/* Filtro por Lote */}
              {lotesDisponiveis.length > 0 && (
                <select
                  value={filtroLote}
                  onChange={(e) => {
                    setFiltroLote(e.target.value)
                    setPaginaAtual(1)
                  }}
                  aria-label="Filtrar por lote"
                  className="h-10 max-w-full rounded-xl border border-[#d9e2db] bg-white px-3 text-sm font-medium text-[#334139] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15 sm:max-w-[200px]"
                >
                  <option value="TODOS">Lote: Todos</option>
                  {lotesDisponiveis.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.identificacao}
                    </option>
                  ))}
                </select>
              )}

              {/* Alternador de visualização: Cards IoT | Por Lote | Lista Densa */}
              <div
                role="group"
                aria-label="Modo de exibição dos sensores"
                className="inline-flex h-10 rounded-xl bg-[#f3f6f4] p-1"
              >
                <button
                  type="button"
                  onClick={() => alterarModoExibicao('cards')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                    modoExibicao === 'cards'
                      ? 'bg-white text-[#18251e] shadow-sm'
                      : 'text-[#66746c] hover:text-[#18251e]'
                  }`}
                >
                  <LayoutGrid size={14} />
                  Cards
                </button>

                <button
                  type="button"
                  onClick={() => alterarModoExibicao('lotes')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                    modoExibicao === 'lotes'
                      ? 'bg-white text-[#18251e] shadow-sm'
                      : 'text-[#66746c] hover:text-[#18251e]'
                  }`}
                >
                  <FolderTree size={14} />
                  Por Lote
                </button>

                <button
                  type="button"
                  onClick={() => alterarModoExibicao('tabela')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                    modoExibicao === 'tabela'
                      ? 'bg-white text-[#18251e] shadow-sm'
                      : 'text-[#66746c] hover:text-[#18251e]'
                  }`}
                >
                  <List size={14} />
                  Lista
                </button>
              </div>
            </div>
          </div>

          {/* Feedbacks */}
          {(mensagemSucesso || erroExclusao) && (
            <div className="mt-5 space-y-3">
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

          {/* Conteúdo */}
          {carregando ? (
            <div
              className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              role="status"
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-2xl border border-[#edf1ee] bg-[#f9fbfa] p-5"
                />
              ))}
            </div>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : sensoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <Cpu size={22} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#1f2d25]">
                Nenhum sensor encontrado
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#68756d]">
                {temFiltroAtivo
                  ? 'Nenhum dispositivo corresponde aos filtros aplicados.'
                  : 'Quando você cadastrar um sensor em um lote de uma de suas propriedades, ele aparece aqui.'}
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
              {modoExibicao === 'lotes' ? (
                <div className="mt-6 space-y-7">
                  {gruposPaginados.map((grupo) => (
                    <div key={grupo.id}>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf7f1] text-[#15693E]">
                          <MapPin size={15} />
                        </span>
                        <h3 className="text-base font-semibold text-[#1c2922]">
                          {grupo.loteNome}
                        </h3>
                        <span className="rounded-full bg-[#f3f6f4] px-2.5 py-0.5 text-xs font-semibold text-[#5c6a62]">
                          {grupo.itens.length}{' '}
                          {grupo.itens.length === 1 ? 'sensor' : 'sensores'}
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {grupo.itens.map((sensor) => renderCardHardware(sensor))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : modoExibicao === 'tabela' ? (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-[#edf1ee]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf1ee] bg-[#f9fbfa] text-xs font-semibold uppercase tracking-wider text-[#6e7d74]">
                        <th className="py-3.5 pl-5 pr-4">Código Serial</th>
                        <th className="px-4 py-3.5">Variável</th>
                        <th className="px-4 py-3.5">Lote &amp; Ponto</th>
                        <th className="px-4 py-3.5">Instalação</th>
                        <th className="px-4 py-3.5">Status</th>
                        {podeEditar && (
                          <th className="py-3.5 pl-4 pr-5 text-right">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1ee] text-sm">
                      {sensoresPaginados.map((sensor) => {
                        const { rotulo, Icone, bgIcone } = obterEstiloTipoSensor(
                          sensor.tipo,
                        )
                        return (
                          <tr
                            key={sensor.id}
                            className="transition-colors hover:bg-[#f7fbf8]"
                          >
                            <td className="py-3 pl-5 pr-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <code className="rounded-md border border-[#e0e7e2] bg-[#f7faf8] px-2 py-0.5 font-mono text-xs font-bold text-[#18251e]">
                                  {sensor.codigo}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => void copiarCodigo(sensor)}
                                  className="rounded p-1 text-[#8a9890] hover:bg-[#edf7f1] hover:text-[#15693E]"
                                  aria-label={`Copiar código ${sensor.codigo}`}
                                >
                                  {codigoCopiadoId === sensor.id ? (
                                    <Check size={13} className="text-[#009B4D]" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bgIcone}`}
                              >
                                <Icone size={13} />
                                {rotulo}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <p className="font-medium text-[#25332b]">
                                {sensor.lote.identificacao}
                              </p>
                              <p className="text-xs text-[#68756d]">
                                {sensor.localizacao || 'Localização padrão'}
                              </p>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#526058]">
                              {formatarData(sensor.dataInstalacao)}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Online
                              </span>
                            </td>

                            {podeEditar && (
                              <td className="py-3 pl-4 pr-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-2">
                                  <Link
                                    to={`/sensores/${sensor.id}/editar`}
                                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#D9A31A] bg-white px-2.5 text-xs font-semibold text-[#9A7000] hover:bg-[#FFF9E8]"
                                  >
                                    <Pencil size={12} />
                                    Editar
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setSensorParaExcluir(sensor)}
                                    className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#E57373] bg-white px-2.5 text-xs font-semibold text-[#C62828] hover:bg-[#FFF5F5]"
                                  >
                                    <Trash2 size={12} />
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {sensoresPaginados.map((sensor) => renderCardHardware(sensor))}
                </div>
              )}

              {/* Rodapé com Paginação */}
              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 text-xs text-[#68756d] sm:flex-row">
                <p>
                  Mostrando{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {((paginaSegura - 1) * itensPorPagina + 1).toLocaleString('pt-BR')}
                  </strong>{' '}
                  a{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {Math.min(
                      paginaSegura * itensPorPagina,
                      totalItensPaginaveis,
                    ).toLocaleString('pt-BR')}
                  </strong>{' '}
                  de{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {totalItensPaginaveis.toLocaleString('pt-BR')}
                  </strong>{' '}
                  {modoExibicao === 'lotes'
                    ? totalItensPaginaveis === 1
                      ? 'lote'
                      : 'lotes'
                    : totalItensPaginaveis === 1
                      ? 'sensor'
                      : 'sensores'}
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
                      Página {paginaSegura.toLocaleString('pt-BR')} de{' '}
                      {totalPaginas.toLocaleString('pt-BR')}
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

      {/* Modal de confirmação de exclusão */}
      <AlertDialog.Root
        open={sensorParaExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindo) setSensorParaExcluir(null)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
            <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
              Confirmar exclusão do sensor
            </AlertDialog.Title>

            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
              Tem certeza que deseja excluir o sensor{' '}
              <code className="rounded bg-[#f3f6f4] px-1.5 py-0.5 font-mono text-xs font-bold text-[#18251e]">
                {sensorParaExcluir?.codigo}
              </code>
              ? Ele deixará de receber novas leituras imediatamente.
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={excluindo}
                onClick={() => setSensorParaExcluir(null)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={excluindo}
                onClick={() => void confirmarExclusao()}
              >
                {excluindo ? 'Excluindo...' : 'Excluir sensor'}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </AppShell>
  )
}