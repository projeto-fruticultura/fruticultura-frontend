import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  UserCheck,
  Users,
  UserX,
  Wrench,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import { usuarioService } from '@/services/usuarioService'
import type { PropriedadeResumo, Usuario } from '@/types/api'

type FiltroPerfil = 'TODOS' | 'PRODUTOR' | 'TECNICO' | 'ADMIN'
type FiltroStatus = 'TODOS' | 'ATIVO' | 'INATIVO'

const ITENS_POR_PAGINA = 15

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterIniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function renderBadgePerfil(perfil: Usuario['perfil']) {
  if (perfil === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
        <ShieldCheck size={13} aria-hidden="true" />
        ADMIN
      </span>
    )
  }

  if (perfil === 'TECNICO') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <Wrench size={13} aria-hidden="true" />
        TÉCNICO
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#edf7f1] px-2.5 py-0.5 text-xs font-semibold text-[#15693E]">
      <Sprout size={13} aria-hidden="true" />
      PRODUTOR
    </span>
  )
}

export default function Usuarios() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.perfil === 'ADMIN'

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Filtros, busca e paginação client-side
  const [busca, setBusca] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<FiltroPerfil>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [emailCopiadoId, setEmailCopiadoId] = useState<number | null>(null)

  // Controle das ações administrativas
  const [acaoPendente, setAcaoPendente] = useState<Usuario | null>(null)
  const [processando, setProcessando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [listaDesatualizada, setListaDesatualizada] = useState(false)

  // Gerenciamento de propriedades vinculadas aos Técnicos
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<Usuario | null>(null)
  const [propriedadesDisponiveis, setPropriedadesDisponiveis] = useState<PropriedadeResumo[]>([])
  const [propriedadesSelecionadas, setPropriedadesSelecionadas] = useState<number[]>([])
  const [buscaPropriedade, setBuscaPropriedade] = useState('')
  const [carregandoVinculos, setCarregandoVinculos] = useState(false)
  const [vinculosCarregados, setVinculosCarregados] = useState(false)
  const [salvandoVinculos, setSalvandoVinculos] = useState(false)
  const [erroVinculos, setErroVinculos] = useState('')

  const operacaoEmAndamento = useRef(false)
  const requisicaoVinculosAtual = useRef(0)
  const salvamentoVinculosEmAndamento = useRef(false)

  useEffect(() => {
    if (!isAdmin) return

    let ativo = true

    async function carregar() {
      try {
        const lista = await usuarioService.listar()
        if (!ativo) return
        setUsuarios(lista)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar os usuários.',
          )
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    void carregar()

    return () => {
      ativo = false
    }
  }, [isAdmin])

  // Contadores gerais (KPIs e abas)
  const contadores = useMemo(() => {
    let produtores = 0
    let tecnicos = 0
    let admins = 0
    let inativos = 0

    for (const u of usuarios) {
      if (u.perfil === 'PRODUTOR') produtores++
      else if (u.perfil === 'TECNICO') tecnicos++
      else if (u.perfil === 'ADMIN') admins++

      if (u.status === 'INATIVO') inativos++
    }

    return {
      total: usuarios.length,
      produtores,
      tecnicos,
      admins,
      inativos,
    }
  }, [usuarios])

  // Lista filtrada por busca, perfil e status
  const usuariosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return usuarios.filter((u) => {
      if (filtroPerfil !== 'TODOS' && u.perfil !== filtroPerfil) return false
      if (filtroStatus !== 'TODOS' && u.status !== filtroStatus) return false

      if (termo) {
        const nomeNorm = normalizarTexto(u.nome)
        const emailNorm = normalizarTexto(u.email)
        if (!nomeNorm.includes(termo) && !emailNorm.includes(termo)) {
          return false
        }
      }

      return true
    })
  }, [usuarios, busca, filtroPerfil, filtroStatus])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA))
  const paginaSegura = Math.min(paginaAtual, totalPaginas)

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA
    return usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [usuariosFiltrados, paginaSegura])

  // Propriedades filtradas dentro do modal do técnico
  const propriedadesFiltradasModal = useMemo(() => {
    const termo = normalizarTexto(buscaPropriedade)
    if (!termo) return propriedadesDisponiveis

    return propriedadesDisponiveis.filter((p) => {
      const texto = normalizarTexto(`${p.nome} ${p.cidade} ${p.uf}`)
      return texto.includes(termo)
    })
  }, [propriedadesDisponiveis, buscaPropriedade])

  function alterarBusca(valor: string) {
    setBusca(valor)
    setPaginaAtual(1)
  }

  function alterarFiltroPerfil(perfil: FiltroPerfil) {
    setFiltroPerfil(perfil)
    setPaginaAtual(1)
  }

  function alterarFiltroStatus(status: FiltroStatus) {
    setFiltroStatus(status)
    setPaginaAtual(1)
  }

  function limparFiltros() {
    setBusca('')
    setFiltroPerfil('TODOS')
    setFiltroStatus('TODOS')
    setPaginaAtual(1)
  }

  async function copiarEmail(u: Usuario) {
    try {
      await navigator.clipboard.writeText(u.email)
      setEmailCopiadoId(u.id)
      setTimeout(() => {
        setEmailCopiadoId((atual) => (atual === u.id ? null : atual))
      }, 1800)
    } catch {
      // Ignora caso o navegador bloqueie clipboard sem foco
    }
  }

  async function abrirGerenciamentoPropriedades(tecnico: Usuario) {
    if (
      !isAdmin ||
      tecnico.perfil !== 'TECNICO' ||
      processando ||
      salvandoVinculos ||
      carregandoVinculos ||
      listaDesatualizada
    ) {
      return
    }

    const requisicaoAtual = ++requisicaoVinculosAtual.current

    setTecnicoSelecionado(tecnico)
    setPropriedadesDisponiveis([])
    setPropriedadesSelecionadas([])
    setBuscaPropriedade('')
    setErroVinculos('')
    setVinculosCarregados(false)
    setCarregandoVinculos(true)

    try {
      const [propriedades, vinculadas] = await Promise.all([
        propriedadeService.listar(),
        usuarioService.listarPropriedades(tecnico.id),
      ])

      if (requisicaoAtual !== requisicaoVinculosAtual.current) {
        return
      }

      setPropriedadesDisponiveis(propriedades)
      setPropriedadesSelecionadas(vinculadas.map((propriedade) => propriedade.id))
      setVinculosCarregados(true)
    } catch (error) {
      if (requisicaoAtual !== requisicaoVinculosAtual.current) {
        return
      }

      setErroVinculos(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar as propriedades do Técnico.',
      )
    } finally {
      if (requisicaoAtual === requisicaoVinculosAtual.current) {
        setCarregandoVinculos(false)
      }
    }
  }

  function alternarPropriedade(propriedadeId: number) {
    if (carregandoVinculos || salvandoVinculos || erroVinculos) {
      return
    }

    setPropriedadesSelecionadas((selecionadas) =>
      selecionadas.includes(propriedadeId)
        ? selecionadas.filter((id) => id !== propriedadeId)
        : [...selecionadas, propriedadeId],
    )
  }

  function fecharGerenciamentoPropriedades() {
    if (salvandoVinculos) {
      return
    }

    requisicaoVinculosAtual.current += 1
    setTecnicoSelecionado(null)
    setBuscaPropriedade('')
    setCarregandoVinculos(false)
    setVinculosCarregados(false)
  }

  async function salvarVinculos() {
    if (
      !isAdmin ||
      !tecnicoSelecionado ||
      tecnicoSelecionado.perfil !== 'TECNICO' ||
      !vinculosCarregados ||
      carregandoVinculos ||
      salvandoVinculos ||
      salvamentoVinculosEmAndamento.current
    ) {
      return
    }

    salvamentoVinculosEmAndamento.current = true

    const tecnico = tecnicoSelecionado
    const idsSelecionados = [...propriedadesSelecionadas]

    setSalvandoVinculos(true)
    setErroVinculos('')
    setMensagemSucesso('')

    try {
      await usuarioService.vincularPropriedades(tecnico.id, idsSelecionados)

      setMensagemSucesso(
        `Propriedades do Técnico "${tecnico.nome}" atualizadas com sucesso.`,
      )

      requisicaoVinculosAtual.current += 1
      setTecnicoSelecionado(null)
      setBuscaPropriedade('')
      setCarregandoVinculos(false)
      setVinculosCarregados(false)
    } catch (error) {
      setErroVinculos(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar os vínculos. Tente novamente.',
      )
    } finally {
      salvamentoVinculosEmAndamento.current = false
      setSalvandoVinculos(false)
    }
  }

  function solicitarAlteracaoStatus(u: Usuario) {
    if (!isAdmin || operacaoEmAndamento.current || listaDesatualizada) {
      return
    }

    if (u.id === usuario?.id && u.status === 'ATIVO') {
      setErroAcao('Você não pode inativar a sua própria conta.')
      return
    }

    setMensagemSucesso('')
    setErroAcao('')
    setAcaoPendente(u)
  }

  async function confirmarAlteracaoStatus() {
    if (
      !acaoPendente ||
      !isAdmin ||
      operacaoEmAndamento.current ||
      listaDesatualizada
    ) {
      return
    }

    const alvo = acaoPendente
    const inativando = alvo.status === 'ATIVO'

    if (inativando && alvo.id === usuario?.id) {
      setErroAcao('Você não pode inativar a sua própria conta.')
      setAcaoPendente(null)
      return
    }

    operacaoEmAndamento.current = true
    setProcessando(true)
    setMensagemSucesso('')
    setErroAcao('')

    try {
      if (inativando) {
        await usuarioService.inativar(alvo.id)
      } else {
        await usuarioService.reativar(alvo.id)
      }

      const novoStatus: Usuario['status'] = inativando ? 'INATIVO' : 'ATIVO'

      setUsuarios((listaAtual) =>
        listaAtual.map((u) =>
          u.id === alvo.id ? { ...u, status: novoStatus } : u,
        ),
      )

      setAcaoPendente(null)

      setMensagemSucesso(
        `Usuário "${alvo.nome}" ${
          inativando ? 'inativado' : 'reativado'
        } com sucesso.`,
      )

      try {
        const listaAtualizada = await usuarioService.listar()
        setUsuarios(listaAtualizada)
      } catch {
        setListaDesatualizada(true)
        setErroAcao(
          'O status foi alterado com sucesso, mas não foi possível sincronizar a listagem. Recarregue a página antes de realizar outra ação.',
        )
      }
    } catch (error) {
      setErroAcao(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível alterar o status do usuário.',
      )

      setAcaoPendente(null)
    } finally {
      operacaoEmAndamento.current = false
      setProcessando(false)
    }
  }

  if (!isAdmin) {
    return (
      <AppShell section="usuarios">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8">
          <FeedbackMessage variant="error">
            Acesso restrito. Esta área é exclusiva para administradores.
          </FeedbackMessage>
        </div>
      </AppShell>
    )
  }

  const temFiltroAtivo =
    busca.trim() !== '' || filtroPerfil !== 'TODOS' || filtroStatus !== 'TODOS'

  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho */}
        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(1.85rem,3vw,2.5rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Gestão de Usuários e Acessos
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#68756d]">
                Controle contas, permissões RBAC e vínculos de propriedades dos
                técnicos da plataforma.
              </p>
            </div>

            <Link
              to="/usuarios/novo"
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 lg:self-auto"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar usuário
            </Link>
          </div>
        </section>

        {/* KPIs de resumo */}
        {!carregando && !erro && (
          <section
            aria-label="Resumo de usuários"
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Total de contas
                </span>
                <Users size={16} className="text-[#009B4D]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {contadores.total}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Produtores
                </span>
                <Sprout size={16} className="text-[#009B4D]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {contadores.produtores}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Técnicos
                </span>
                <Wrench size={16} className="text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {contadores.tecnicos}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e1e7e3] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#68756d]">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Inativos
                </span>
                <UserX size={16} className="text-red-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#18251e]">
                {contadores.inativos}
              </p>
            </div>
          </section>
        )}

        {/* Área principal da tabela */}
        <section className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          {/* Barra de ferramentas: Abas de Perfil + Busca + Filtro Status */}
          <div className="border-b border-[#edf1ee] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* Abas por Perfil */}
              <div
                role="tablist"
                aria-label="Filtrar por perfil"
                className="flex flex-wrap gap-1.5 rounded-xl bg-[#f3f6f4] p-1"
              >
                {(
                  [
                    { id: 'TODOS', label: 'Todos', count: contadores.total },
                    {
                      id: 'PRODUTOR',
                      label: 'Produtores',
                      count: contadores.produtores,
                    },
                    {
                      id: 'TECNICO',
                      label: 'Técnicos',
                      count: contadores.tecnicos,
                    },
                    { id: 'ADMIN', label: 'Admins', count: contadores.admins },
                  ] as const
                ).map((aba) => {
                  const ativa = filtroPerfil === aba.id
                  return (
                    <button
                      key={aba.id}
                      type="button"
                      role="tab"
                      aria-selected={ativa}
                      onClick={() => alterarFiltroPerfil(aba.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        ativa
                          ? 'bg-white text-[#18251e] shadow-sm'
                          : 'text-[#66746c] hover:text-[#18251e]'
                      }`}
                    >
                      <span>{aba.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          ativa
                            ? 'bg-[#edf7f1] text-[#15693E]'
                            : 'bg-[#e3e9e5] text-[#5c6a62]'
                        }`}
                      >
                        {aba.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Busca e Status */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px] flex-1 sm:w-72">
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a8980]"
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => alterarBusca(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    aria-label="Buscar usuário por nome ou e-mail"
                    className="h-10 w-full rounded-xl border border-[#d9e2db] bg-white pl-9 pr-8 text-sm text-[#1f2d25] placeholder:text-[#86948c] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                  />
                  {busca && (
                    <button
                      type="button"
                      onClick={() => alterarBusca('')}
                      aria-label="Limpar busca"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#7a8980] hover:bg-[#f3f6f4] hover:text-[#1f2d25]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={filtroStatus}
                  onChange={(e) =>
                    alterarFiltroStatus(e.target.value as FiltroStatus)
                  }
                  aria-label="Filtrar por status"
                  className="h-10 rounded-xl border border-[#d9e2db] bg-white px-3 text-sm font-medium text-[#334139] focus:border-[#009B4D] focus:outline-none focus:ring-4 focus:ring-[#009B4D]/15"
                >
                  <option value="TODOS">Status: Todos</option>
                  <option value="ATIVO">Apenas Ativos</option>
                  <option value="INATIVO">Apenas Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mensagens de feedback */}
          {(mensagemSucesso || erroAcao) && (
            <div className="space-y-3 px-4 pt-4 sm:px-6">
              {mensagemSucesso && (
                <FeedbackMessage variant="success">
                  {mensagemSucesso}
                </FeedbackMessage>
              )}
              {erroAcao && (
                <FeedbackMessage variant="error">{erroAcao}</FeedbackMessage>
              )}
            </div>
          )}

          {/* Conteúdo: Skeleton / Erro / Vazio / Tabela */}
          {carregando ? (
            <div className="divide-y divide-[#edf1ee] p-4 sm:p-6">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center justify-between py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#e8eeea]" />
                    <div className="space-y-2">
                      <div className="h-4 w-44 rounded bg-[#e8eeea]" />
                      <div className="h-3 w-56 rounded bg-[#f0f4f1]" />
                    </div>
                  </div>
                  <div className="hidden h-8 w-48 rounded-lg bg-[#f0f4f1] sm:block" />
                </div>
              ))}
            </div>
          ) : erro ? (
            <div className="p-4 sm:p-6">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#15693E]">
                <Users size={22} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#1f2d25]">
                Nenhum usuário encontrado
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#68756d]">
                {temFiltroAtivo
                  ? 'Nenhum cadastro corresponde aos filtros aplicados no momento.'
                  : 'Ainda não existem outros usuários cadastrados na plataforma.'}
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
                      <th className="py-3.5 pl-6 pr-4">Usuário</th>
                      <th className="px-4 py-3.5">Perfil</th>
                      <th className="px-4 py-3.5">Escopo / Vínculos</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1ee] text-sm">
                    {usuariosPaginados.map((u) => {
                      const podeInativarPropriaConta =
                        u.id === usuario?.id && u.status === 'ATIVO'

                      const botaoDesabilitado =
                        processando ||
                        listaDesatualizada ||
                        podeInativarPropriaConta

                      return (
                        <tr
                          key={u.id}
                          className="transition-colors hover:bg-[#f7fbf8]"
                        >
                          {/* Coluna 1: Avatar + Nome + E-mail copiável */}
                          <td className="py-3.5 pl-6 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-xs font-bold text-[#15693E]">
                                {obterIniciais(u.nome) || 'US'}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-semibold text-[#1f2d25]">
                                    {u.nome}
                                  </span>
                                  {u.id === usuario?.id && (
                                    <span className="rounded bg-[#edf7f1] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#15693E]">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#68756d]">
                                  <span className="truncate">{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => void copiarEmail(u)}
                                    title="Copiar e-mail"
                                    aria-label={`Copiar e-mail de ${u.nome}`}
                                    className="rounded p-0.5 text-[#8a9890] transition hover:bg-[#e8f0eb] hover:text-[#15693E]"
                                  >
                                    {emailCopiadoId === u.id ? (
                                      <Check
                                        size={13}
                                        className="text-[#009B4D]"
                                      />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Perfil */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {renderBadgePerfil(u.perfil)}
                          </td>

                          {/* Coluna 3: Escopo / Vínculos (mantém simetria visual entre perfis) */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {u.perfil === 'TECNICO' ? (
                              <button
                                type="button"
                                disabled={processando || listaDesatualizada}
                                onClick={() =>
                                  void abrirGerenciamentoPropriedades(u)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe3d7] bg-[#f4fbf7] px-3 py-1.5 text-xs font-semibold text-[#15693E] transition hover:border-[#009B4D] hover:bg-[#e6f5ec] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <MapPin size={14} aria-hidden="true" />
                                Vincular propriedades
                              </button>
                            ) : u.perfil === 'ADMIN' ? (
                              <span className="text-xs text-[#738279]">
                                Acesso administrativo global
                              </span>
                            ) : (
                              <span className="text-xs text-[#738279]">
                                Propriedades próprias
                              </span>
                            )}
                          </td>

                          {/* Coluna 4: Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                u.status === 'ATIVO'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  u.status === 'ATIVO'
                                    ? 'bg-emerald-600'
                                    : 'bg-red-600'
                                }`}
                              />
                              {u.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          {/* Coluna 5: Ações sempre alinhadas */}
                          <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2">
                              <Link
                                to={`/usuarios/${u.id}/editar`}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d9e2db] bg-white px-3 text-xs font-semibold text-[#334139] transition hover:border-[#009B4D] hover:bg-[#f0faf4] hover:text-[#15693E]"
                              >
                                <Pencil size={14} aria-hidden="true" />
                                Editar
                              </Link>

                              <Button
                                type="button"
                                variant={
                                  u.status === 'ATIVO'
                                    ? 'destructive'
                                    : 'outline'
                                }
                                size="sm"
                                className="h-9 min-w-[104px] text-xs"
                                disabled={botaoDesabilitado}
                                title={
                                  podeInativarPropriaConta
                                    ? 'Você não pode inativar sua própria conta'
                                    : listaDesatualizada
                                      ? 'Recarregue a página para atualizar a lista'
                                      : undefined
                                }
                                onClick={() => solicitarAlteracaoStatus(u)}
                              >
                                {u.status === 'ATIVO' ? (
                                  <>
                                    <UserX size={14} aria-hidden="true" />
                                    Inativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} aria-hidden="true" />
                                    Reativar
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Lista Compacta Mobile / Tablet */}
              <div className="divide-y divide-[#edf1ee] lg:hidden">
                {usuariosPaginados.map((u) => {
                  const podeInativarPropriaConta =
                    u.id === usuario?.id && u.status === 'ATIVO'

                  const botaoDesabilitado =
                    processando ||
                    listaDesatualizada ||
                    podeInativarPropriaConta

                  return (
                    <article key={u.id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-xs font-bold text-[#15693E]">
                            {obterIniciais(u.nome) || 'US'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-[#1f2d25]">
                              {u.nome}
                            </h3>
                            <p className="truncate text-xs text-[#68756d]">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.status === 'ATIVO'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {renderBadgePerfil(u.perfil)}

                        {u.perfil === 'TECNICO' && (
                          <button
                            type="button"
                            disabled={processando || listaDesatualizada}
                            onClick={() =>
                              void abrirGerenciamentoPropriedades(u)
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#f4fbf7] px-3 py-1 text-xs font-semibold text-[#15693E]"
                          >
                            <MapPin size={13} />
                            Propriedades
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Link
                          to={`/usuarios/${u.id}/editar`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d9e2db] bg-white px-3 text-xs font-semibold text-[#334139]"
                        >
                          <Pencil size={14} />
                          Editar
                        </Link>

                        <Button
                          type="button"
                          variant={
                            u.status === 'ATIVO' ? 'destructive' : 'outline'
                          }
                          size="sm"
                          className="h-9 text-xs"
                          disabled={botaoDesabilitado}
                          onClick={() => solicitarAlteracaoStatus(u)}
                        >
                          {u.status === 'ATIVO' ? (
                            <>
                              <UserX size={14} />
                              Inativar
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              Reativar
                            </>
                          )}
                        </Button>
                      </div>
                    </article>
                  )
                })}
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
                      usuariosFiltrados.length,
                    )}
                  </strong>{' '}
                  de{' '}
                  <strong className="font-semibold text-[#1f2d25]">
                    {usuariosFiltrados.length}
                  </strong>{' '}
                  {usuariosFiltrados.length === 1 ? 'usuário' : 'usuários'}
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

      {/* Modal de confirmação de status */}
      <AlertDialog.Root
        open={acaoPendente !== null}
        onOpenChange={(aberto) => {
          if (!aberto && !operacaoEmAndamento.current) {
            setAcaoPendente(null)
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
            <AlertDialog.Title className="text-xl font-semibold text-[#18251e]">
              Confirmar{' '}
              {acaoPendente?.status === 'ATIVO' ? 'inativação' : 'reativação'}
            </AlertDialog.Title>

            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[#68756d]">
              Deseja realmente{' '}
              {acaoPendente?.status === 'ATIVO' ? 'inativar' : 'reativar'} o
              usuário "{acaoPendente?.nome}"?
              {acaoPendente?.status === 'ATIVO'
                ? ' O acesso à plataforma será bloqueado até a reativação.'
                : ' O usuário poderá acessar novamente a plataforma com suas credenciais.'}
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={processando}
                onClick={() => setAcaoPendente(null)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant={
                  acaoPendente?.status === 'ATIVO' ? 'destructive' : 'default'
                }
                size="lg"
                disabled={processando || !acaoPendente}
                onClick={() => void confirmarAlteracaoStatus()}
              >
                {processando ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Modal de gerenciamento de propriedades */}
      <Dialog.Root
        open={tecnicoSelecionado !== null}
        onOpenChange={(aberto) => {
          if (!aberto) {
            fecharGerenciamentoPropriedades()
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />

          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[51] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-2xl">
            <Dialog.Title className="text-xl font-semibold text-[#18251e]">
              Gerenciar propriedades
            </Dialog.Title>

            <Dialog.Description className="mt-2 text-sm text-[#68756d]">
              Selecione as propriedades que ficarão vinculadas ao Técnico{' '}
              <strong>{tecnicoSelecionado?.nome}</strong>.
            </Dialog.Description>

            <div className="mt-5">
              {carregandoVinculos ? (
                <p className="text-sm text-[#68756d]">
                  Carregando propriedades e vínculos...
                </p>
              ) : erroVinculos ? (
                <FeedbackMessage variant="error">
                  {erroVinculos}
                </FeedbackMessage>
              ) : vinculosCarregados ? (
                propriedadesDisponiveis.length === 0 ? (
                  <p className="text-sm text-[#68756d]">
                    Nenhuma propriedade disponível.
                  </p>
                ) : (
                  <>
                    {/* Busca rápida de propriedades no modal */}
                    <div className="relative mb-3">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8980]"
                      />
                      <input
                        type="search"
                        value={buscaPropriedade}
                        onChange={(e) => setBuscaPropriedade(e.target.value)}
                        placeholder="Filtrar por nome da fazenda ou cidade..."
                        className="h-9 w-full rounded-xl border border-[#d9e2db] bg-[#f9fbfa] pl-9 pr-3 text-sm text-[#1f2d25] placeholder:text-[#86948c] focus:border-[#009B4D] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {propriedadesFiltradasModal.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#68756d]">
                        Nenhuma propriedade encontrada para "{buscaPropriedade}".
                      </p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {propriedadesFiltradasModal.map((propriedade) => (
                          <label
                            key={propriedade.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dfe6e1] p-3.5 transition hover:border-[#b7d6c3] hover:bg-[#f0faf4]"
                          >
                            <input
                              type="checkbox"
                              checked={propriedadesSelecionadas.includes(
                                propriedade.id,
                              )}
                              onChange={() =>
                                alternarPropriedade(propriedade.id)
                              }
                              disabled={salvandoVinculos}
                              className="h-4 w-4 accent-[#009B4D]"
                            />

                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#202d25]">
                                {propriedade.nome}
                              </span>

                              <span className="block text-xs text-[#68756d]">
                                {propriedade.cidade} - {propriedade.uf}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )
              ) : null}
            </div>

            {vinculosCarregados && !erroVinculos && (
              <div className="mt-4 flex items-center justify-between text-xs text-[#68756d]">
                <span>
                  <strong className="font-semibold text-[#1f2d25]">
                    {propriedadesSelecionadas.length}
                  </strong>{' '}
                  {propriedadesSelecionadas.length === 1
                    ? 'propriedade selecionada'
                    : 'propriedades selecionadas'}
                </span>

                {propriedadesSelecionadas.length > 0 && (
                  <button
                    type="button"
                    disabled={salvandoVinculos}
                    onClick={() => setPropriedadesSelecionadas([])}
                    className="font-semibold text-[#15693E] hover:underline disabled:opacity-50"
                  >
                    Desmarcar todas
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={salvandoVinculos}
                onClick={fecharGerenciamentoPropriedades}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                size="lg"
                disabled={
                  carregandoVinculos ||
                  salvandoVinculos ||
                  !vinculosCarregados
                }
                onClick={() => void salvarVinculos()}
              >
                {salvandoVinculos ? 'Salvando...' : 'Salvar vínculos'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </AppShell>
  )
}