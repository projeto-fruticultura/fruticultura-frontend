import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, Pencil, Plus, Truck, X } from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'
import {
  Campo,
  EstadoVazio,
  botaoSecundario,
  campo,
  cartao,
} from '@/components/app/produtor/ProdutorUi'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarMoeda, formatarNumero } from '@/lib/formatar'
import { avaliarCadeiaFrio, type SituacaoFrio } from '@/lib/indicadoresProdutor'
import { ApiError } from '@/services/api'
import { logisticaService } from '@/services/logisticaService'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeResumo } from '@/types/api'
import type {
  LogisticaPayload,
  LogisticaRegistro,
  ModalLogistica,
  PaginacaoLogistica,
  SituacaoLogistica,
} from '@/types/logistica'

const botaoPrincipal =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,155,77,.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'

const MODAIS: Array<{ valor: ModalLogistica; texto: string }> = [
  { valor: 'RODOVIARIO', texto: 'Rodoviário' },
  { valor: 'FERROVIARIO', texto: 'Ferroviário' },
  { valor: 'AEREO', texto: 'Aéreo' },
  { valor: 'MARITIMO', texto: 'Marítimo' },
]

const SITUACOES: Array<{ valor: SituacaoLogistica; texto: string }> = [
  { valor: 'PLANEJADA', texto: 'Planejada' },
  { valor: 'EM_TRANSITO', texto: 'Em trânsito' },
  { valor: 'ENTREGUE', texto: 'Entregue' },
  { valor: 'CANCELADA', texto: 'Cancelada' },
]

const cadeiaFrio: Record<SituacaoFrio, { texto: string; estilo: string }> = {
  SEM_EXIGENCIA: {
    texto: 'Refrigeração rápida dispensada',
    estilo: 'bg-slate-100 text-slate-700',
  },
  PENDENTE: {
    texto: 'Refrigeração exigida · medição pendente',
    estilo: 'bg-amber-100 text-amber-900',
  },
  CONFORME: {
    texto: 'Resfriamento informado dentro da janela',
    estilo: 'bg-emerald-100 text-emerald-900',
  },
  ATENCAO: {
    texto: 'Atenção: prazo ou temperatura fora da faixa',
    estilo: 'bg-red-100 text-red-900',
  },
}

type CamposForm = {
  propriedadeId: string
  origem: string
  destino: string
  modal: ModalLogistica
  transportadora: string
  custo: string
  situacao: SituacaoLogistica
  tempoEstimadoHoras: string
  exigeRefrigeracaoRapida: string
  colhidoEm: string
  resfriadoEm: string
  temperaturaResfriamentoC: string
}

const vazio: CamposForm = {
  propriedadeId: '',
  origem: '',
  destino: '',
  modal: 'RODOVIARIO',
  transportadora: '',
  custo: '',
  situacao: 'PLANEJADA',
  tempoEstimadoHoras: '',
  exigeRefrigeracaoRapida: '',
  colhidoEm: '',
  resfriadoEm: '',
  temperaturaResfriamentoC: '',
}

function dataHoraLocal(valor: string | null) {
  const data = valor ? new Date(valor) : null
  if (!data || !Number.isFinite(+data)) return ''
  return new Date(+data - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 23)
}

function dadosFormulario(registro: LogisticaRegistro): CamposForm {
  return {
    propriedadeId: String(registro.propriedadeId),
    origem: registro.origem,
    destino: registro.destino,
    modal: registro.modal as ModalLogistica,
    transportadora: registro.transportadora ?? '',
    custo: registro.custo === null ? '' : String(registro.custo),
    situacao: registro.situacao,
    tempoEstimadoHoras:
      registro.tempoEstimadoHoras === null ? '' : String(registro.tempoEstimadoHoras),
    exigeRefrigeracaoRapida:
      registro.exigeCadeiaFrio === null ? '' : String(registro.exigeCadeiaFrio),
    colhidoEm: dataHoraLocal(registro.colhidoEm),
    resfriadoEm: dataHoraLocal(registro.resfriadoEm),
    temperaturaResfriamentoC:
      registro.temperaturaResfriamentoC === null
        ? ''
        : String(registro.temperaturaResfriamentoC),
  }
}

function validar(form: CamposForm, propriedades: PropriedadeResumo[]) {
  const erros: Record<string, string> = {}
  const propriedadeId = Number(form.propriedadeId)
  if (!propriedades.some((p) => p.id === propriedadeId)) {
    erros.propriedadeId = 'Selecione uma propriedade.'
  }

  const { origem, destino, transportadora } = Object.fromEntries(
    (['origem', 'destino', 'transportadora'] as const).map((campoNome) => {
      const valor = form[campoNome].trim()
      if (!valor || valor.length > 150) {
        erros[campoNome] = 'Informe de 1 a 150 caracteres.'
      }
      return [campoNome, valor]
    }),
  )

  const custo = Number(form.custo)
  const horas = Number(form.tempoEstimadoHoras)
  if (
    !/^\d+(\.\d{1,2})?$/.test(String(custo)) ||
    !form.custo ||
    custo > 9999999999.99
  ) {
    erros.custo =
      'Informe um custo entre R$ 0 e R$ 9.999.999.999,99 com até duas casas decimais.'
  }
  if (!/^\d+(\.\d)?$/.test(String(horas)) || horas <= 0 || horas > 99999.9) {
    erros.tempoEstimadoHoras =
      'Informe de 0,1 a 99.999,9 horas com até uma casa decimal.'
  }

  const temMedicao = Boolean(
    form.colhidoEm || form.resfriadoEm || form.temperaturaResfriamentoC,
  )
  const colheita = Date.parse(form.colhidoEm)
  const resfriamento = Date.parse(form.resfriadoEm)
  const temperatura = Number(form.temperaturaResfriamentoC)

  if (temMedicao) {
    const agora = Date.now()
    if (!Number.isFinite(colheita) || colheita > agora) {
      erros.colhidoEm = 'Informe uma data e hora de colheita que já ocorreram.'
    }
    if (
      !Number.isFinite(resfriamento) ||
      resfriamento > agora ||
      resfriamento < colheita
    ) {
      erros.resfriadoEm =
        'Informe uma data e hora de resfriamento a partir da colheita e até agora.'
    }
    if (
      !form.temperaturaResfriamentoC ||
      !Number.isFinite(temperatura) ||
      temperatura < -273.15 ||
      temperatura > 100
    ) {
      erros.temperaturaResfriamentoC =
        'Informe a temperatura medida entre −273,15 °C e 100 °C.'
    }
  }

  if (Object.keys(erros).length) return { erros }

  const payload: LogisticaPayload = {
    propriedadeId,
    origem,
    destino,
    modal: form.modal,
    transportadora,
    custo,
    situacao: form.situacao,
    tempoEstimadoHoras: horas,
    exigeRefrigeracaoRapida: form.exigeRefrigeracaoRapida
      ? form.exigeRefrigeracaoRapida === 'true'
      : null,
    colhidoEm: temMedicao ? new Date(colheita).toISOString() : null,
    resfriadoEm: temMedicao ? new Date(resfriamento).toISOString() : null,
    temperaturaResfriamentoC: temMedicao ? temperatura : null,
  }

  return { erros, payload }
}

function mensagemErro(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.'
}

export default function Logistica() {
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [filtroPropriedade, setFiltroPropriedade] = useState('')
  const [filtroModal, setFiltroModal] = useState<ModalLogistica | ''>('')
  const [filtroSituacao, setFiltroSituacao] = useState<SituacaoLogistica | ''>('')
  const [pagina, setPagina] = useState(1)
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({})
  const [editando, setEditando] = useState<LogisticaRegistro | null | undefined>(
    undefined,
  )
  const [registroParaInativar, setRegistroParaInativar] =
    useState<LogisticaRegistro | null>(null)
  const [form, setForm] = useState<CamposForm>(vazio)
  const [versao, setVersao] = useState(0)

  const chaveConsulta = [
    filtroPropriedade,
    filtroModal,
    filtroSituacao,
    pagina,
    versao,
  ].join(':')
  const [consulta, setConsulta] = useState<{
    chave: string
    dados: LogisticaRegistro[]
    paginacao?: PaginacaoLogistica
    erro?: string
  }>()

  const consultaAtual = consulta?.chave === chaveConsulta ? consulta : null
  const carregando = consultaAtual === null
  const registros = consultaAtual?.dados ?? []
  const paginacao = consultaAtual?.paginacao
  const erroConsulta = consultaAtual?.erro
  const temFiltroAtivo = Boolean(
    filtroPropriedade || filtroModal || filtroSituacao,
  )

  useEffect(() => {
    let ativo = true
    void propriedadeService
      .listar()
      .then((props) => {
        if (ativo) setPropriedades(props)
      })
      .catch((error: unknown) => {
        if (ativo) setErro(mensagemErro(error))
      })
    return () => {
      ativo = false
    }
  }, [versao])

  useEffect(() => {
    let ativo = true
    void logisticaService
      .listar({
        propriedadeId: filtroPropriedade ? Number(filtroPropriedade) : undefined,
        modal: filtroModal || undefined,
        situacao: filtroSituacao || undefined,
        pagina,
      })
      .then(({ dados, paginacao: pag }) => {
        if (!ativo) return
        const ultimaPagina = Math.max(1, pag.totalPaginas)
        if (pagina > ultimaPagina) {
          setPagina(ultimaPagina)
          return
        }
        setConsulta({ chave: chaveConsulta, dados, paginacao: pag })
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setConsulta({ chave: chaveConsulta, dados: [], erro: mensagemErro(error) })
      })
    return () => {
      ativo = false
    }
  }, [chaveConsulta, filtroPropriedade, filtroModal, filtroSituacao, pagina])

  const nomes = useMemo(
    () => new Map(propriedades.map((p) => [p.id, p.nome])),
    [propriedades],
  )

  function limparFiltros() {
    setFiltroPropriedade('')
    setFiltroModal('')
    setFiltroSituacao('')
    setPagina(1)
  }

  function abrirNovo() {
    setErro('')
    setErrosCampos({})
    setForm({
      ...vazio,
      propriedadeId:
        propriedades.length === 1 ? String(propriedades[0].id) : '',
    })
    setEditando(null)
  }

  function abrirEdicao(registro: LogisticaRegistro) {
    if (!registro.propriedadeId || !nomes.has(registro.propriedadeId)) {
      setErro(
        'Este registro não informa uma propriedade autorizada para edição.',
      )
      return
    }
    if (!MODAIS.some((m) => m.valor === registro.modal)) {
      setErro('O modal deste registro não é reconhecido pelo formulário atual.')
      return
    }
    setErro('')
    setErrosCampos({})
    setForm(dadosFormulario(registro))
    setEditando(registro)
  }

  function alterar<K extends keyof CamposForm>(chave: K, valor: CamposForm[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }))
    setErrosCampos((atuais) => ({ ...atuais, [chave]: '' }))
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setSucesso('')
    const { erros, payload } = validar(form, propriedades)
    setErrosCampos(erros)
    if (!payload) return

    setOcupado(true)
    try {
      if (editando) {
        const { propriedadeId: _propriedadeId, ...campos } = payload
        await logisticaService.atualizar(editando.id, campos)
      } else {
        await logisticaService.criar(payload)
      }
      setEditando(undefined)
      setSucesso(
        editando
          ? 'Planejamento de transporte atualizado.'
          : 'Planejamento de transporte cadastrado.',
      )
      setVersao((v) => v + 1)
    } catch (e) {
      if (e instanceof ApiError && e.campos) setErrosCampos(e.campos)
      setErro(mensagemErro(e))
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarInativacao() {
    if (!registroParaInativar) return
    const alvo = registroParaInativar
    setRegistroParaInativar(null)
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      await logisticaService.remover(alvo.id)
      setSucesso('Solicitação de inativação concluída.')
      setVersao((v) => v + 1)
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setOcupado(false)
    }
  }

  function campoFrete(
    nome: keyof CamposForm,
    rotulo: string,
    controle: (atributos: {
      'aria-invalid': boolean
      'aria-describedby'?: string
    }) => ReactNode,
  ) {
    const erroCampo = errosCampos[nome]
    const erroId = `erro-frete-${nome}`
    return (
      <Campo rotulo={rotulo} erro={erroCampo} erroId={erroId}>
        {controle({
          'aria-invalid': Boolean(erroCampo),
          'aria-describedby': erroCampo ? erroId : undefined,
        })}
      </Campo>
    )
  }

  function obterInfoRegistro(r: LogisticaRegistro) {
    const situacaoFrio = avaliarCadeiaFrio(r)
    const frio =
      r.exigeCadeiaFrio === null
        ? {
            texto: 'Exigência de refrigeração não informada',
            estilo: 'bg-slate-100 text-slate-700',
          }
        : cadeiaFrio[situacaoFrio]
    const nomePropriedade = r.propriedadeId
      ? nomes.get(r.propriedadeId) ?? `Propriedade #${r.propriedadeId}`
      : 'Propriedade não informada'
    const textoSituacao =
      SITUACOES.find((s) => s.valor === r.situacao)?.texto ?? r.situacao
    const textoModal =
      MODAIS.find((m) => m.valor === r.modal)?.texto ?? r.modal

    return {
      situacaoFrio,
      frio,
      nomePropriedade,
      textoSituacao,
      textoModal,
    }
  }

  return (
    <AppShell section="logistica">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
        <section className="mb-5 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Logística e escoamento
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Gerencie o transporte da produção com custos, rotas, situação e
                requisitos de resfriamento.
              </p>
            </div>

            <button
              type="button"
              className={botaoPrincipal}
              onClick={abrirNovo}
              disabled={carregando || ocupado || propriedades.length === 0}
            >
              <Plus size={18} aria-hidden="true" /> Adicionar frete
            </button>
          </div>
        </section>

        {erro ? (
          <div className="mb-4">
            <FeedbackMessage variant="error">{erro}</FeedbackMessage>
          </div>
        ) : null}
        {sucesso ? (
          <div className="mb-4">
            <FeedbackMessage variant="success">{sucesso}</FeedbackMessage>
          </div>
        ) : null}

        <section className={cartao} aria-labelledby="lista-logistica">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="lista-logistica"
              className="flex items-center gap-2 text-base font-semibold text-[#1d2b23]"
            >
              <Truck size={18} className="text-[#168150]" aria-hidden="true" />{' '}
              Transportes{' '}
              <span className="text-sm font-normal text-[#7a8780]">
                {paginacao && !carregando ? `(${paginacao.total})` : ''}
              </span>
            </h2>

            {temFiltroAtivo ? (
              <button
                type="button"
                onClick={limparFiltros}
                disabled={carregando || ocupado}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-semibold text-[#35453c] transition hover:bg-[#f6f8f7] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <X size={14} aria-hidden="true" /> Limpar filtros
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 border-b border-[#e6ece8] pb-4 sm:grid-cols-3">
            <Campo rotulo="Propriedade">
              <select
                className={campo}
                value={filtroPropriedade}
                onChange={(e) => {
                  setPagina(1)
                  setFiltroPropriedade(e.target.value)
                }}
              >
                <option value="">Todas</option>
                {propriedades.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo rotulo="Modal">
              <select
                className={campo}
                value={filtroModal}
                onChange={(e) => {
                  setPagina(1)
                  setFiltroModal(e.target.value as ModalLogistica | '')
                }}
              >
                <option value="">Todos</option>
                {MODAIS.map((m) => (
                  <option value={m.valor} key={m.valor}>
                    {m.texto}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo rotulo="Situação">
              <select
                className={campo}
                value={filtroSituacao}
                onChange={(e) => {
                  setPagina(1)
                  setFiltroSituacao(e.target.value as SituacaoLogistica | '')
                }}
              >
                <option value="">Todas</option>
                {SITUACOES.map((s) => (
                  <option value={s.valor} key={s.valor}>
                    {s.texto}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="mt-4">
            {carregando ? (
              <div role="status" className="py-4 text-sm text-[#6d7a72]">
                Carregando transportes...
              </div>
            ) : erroConsulta ? (
              <FeedbackMessage variant="error">{erroConsulta}</FeedbackMessage>
            ) : registros.length === 0 ? (
              <EstadoVazio>
                {temFiltroAtivo
                  ? 'Nenhum transporte encontrado para os filtros selecionados.'
                  : 'Nenhum transporte cadastrado até o momento.'}
              </EstadoVazio>
            ) : (
              <>
                {/* Cartões no celular */}
                <div className="space-y-3 md:hidden">
                  {registros.map((r) => {
                    const {
                      situacaoFrio,
                      frio,
                      nomePropriedade,
                      textoSituacao,
                      textoModal,
                    } = obterInfoRegistro(r)

                    return (
                      <article
                        key={r.id}
                        className="rounded-2xl border border-[#e1e7e3] bg-[#fcfdfb] p-4 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#15693E]">
                              {nomePropriedade}
                            </p>
                            <h3 className="mt-1 text-sm font-semibold text-[#18251e]">
                              {r.origem} → {r.destino}
                            </h3>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#edf7f1] px-2.5 py-1 text-xs font-semibold text-[#15693E]">
                            {textoSituacao}
                          </span>
                        </div>

                        <div className="mt-3">
                          <p
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${frio.estilo}`}
                          >
                            {situacaoFrio === 'ATENCAO' ? (
                              <AlertTriangle size={13} aria-hidden="true" />
                            ) : null}
                            {frio.texto}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 text-xs text-[#68756d]">
                          <span>
                            {textoModal} ·{' '}
                            {r.transportadora ?? 'Sem transportadora'}
                          </span>
                          <span className="font-medium text-[#2d3a33]">
                            {r.custo === null
                              ? 'Custo não informado'
                              : formatarMoeda(r.custo)}
                            {r.tempoEstimadoHoras !== null
                              ? ` · ${formatarNumero(r.tempoEstimadoHoras)} h`
                              : ''}
                          </span>
                        </div>

                        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3">
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => abrirEdicao(r)}
                            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#c3e2cf] bg-white px-3 text-xs font-semibold text-[#15693E] transition hover:bg-[#edf8f1] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            <Pencil size={14} aria-hidden="true" /> Editar frete
                          </button>

                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => setRegistroParaInativar(r)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] bg-white text-red-700 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            aria-label={`Inativar transporte ${r.id}`}
                          >
                            <X size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Tabela no desktop */}
                <div className="hidden overflow-x-auto rounded-xl border border-[#e6ece8] md:block">
                  <table className="w-full min-w-[940px] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Lista de transportes da produção
                    </caption>
                    <thead className="bg-[#f3f7f4] text-[#435249]">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Propriedade / origem
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Destino
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Modal / transportadora
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Custo / tempo
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Situação / frio
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1ee]">
                      {registros.map((r) => {
                        const {
                          situacaoFrio,
                          frio,
                          nomePropriedade,
                          textoSituacao,
                          textoModal,
                        } = obterInfoRegistro(r)

                        return (
                          <tr key={r.id} className="align-top text-[#2d3a33]">
                            <td className="px-4 py-3">
                              <span className="font-semibold">
                                {nomePropriedade}
                              </span>
                              <p className="mt-1 text-xs text-[#78877e]">
                                {r.origem}
                              </p>
                            </td>
                            <td className="px-4 py-3">{r.destino}</td>
                            <td className="px-4 py-3">
                              {textoModal}
                              <p className="mt-1 text-xs text-[#78877e]">
                                {r.transportadora ?? 'Sem transportadora'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {r.custo === null
                                ? 'Não informado'
                                : formatarMoeda(r.custo)}
                              <p className="mt-1 text-xs text-[#78877e]">
                                {r.tempoEstimadoHoras === null
                                  ? 'Tempo não informado'
                                  : `${formatarNumero(r.tempoEstimadoHoras)} h estimadas`}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium">
                                {textoSituacao}
                              </span>
                              <p
                                className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${frio.estilo}`}
                              >
                                {situacaoFrio === 'ATENCAO' ? (
                                  <AlertTriangle size={12} aria-hidden="true" />
                                ) : null}
                                {frio.texto}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={ocupado}
                                  onClick={() => abrirEdicao(r)}
                                  className="rounded-lg border border-[#dce4df] p-2 text-[#087a49] transition hover:bg-[#f6faf7] focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                  aria-label={`Editar transporte ${r.id}`}
                                >
                                  <Pencil size={16} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  disabled={ocupado}
                                  onClick={() => setRegistroParaInativar(r)}
                                  className="rounded-lg border border-[#dce4df] p-2 text-red-700 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                  aria-label={`Inativar transporte ${r.id}`}
                                >
                                  <X size={16} aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {paginacao && !carregando && paginacao.totalPaginas > 1 ? (
            <nav
              className="mt-4 flex flex-wrap items-center justify-end gap-3"
              aria-label="Páginas de transportes"
            >
              <button
                type="button"
                className={botaoSecundario}
                disabled={pagina <= 1 || ocupado}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </button>
              <span className="text-sm" aria-live="polite">
                Página {paginacao.pagina} de {paginacao.totalPaginas}
              </span>
              <button
                type="button"
                className={botaoSecundario}
                disabled={pagina >= paginacao.totalPaginas || ocupado}
                onClick={() => setPagina(pagina + 1)}
              >
                Próxima
              </button>
            </nav>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-[#7a8780]">
            Para cargas com refrigeração rápida, o resfriamento deve ocorrer em
            menos de 6 horas após a colheita, com temperatura medida entre 0 °C e
            10 °C. A avaliação usa as medições registradas pelo operador.
          </p>
        </section>

        {editando !== undefined ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[1px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-transporte-title"
          >
            <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="form-transporte-title"
                    className="text-lg font-semibold text-[#1d2b23]"
                  >
                    {editando ? 'Editar transporte' : 'Cadastrar transporte'}
                  </h2>
                  <p className="mt-1 text-xs text-[#7a8780]">
                    Preencha o planejamento com as informações da transportadora.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 transition hover:bg-slate-100 cursor-pointer"
                  aria-label="Fechar formulário"
                  disabled={ocupado}
                  onClick={() => setEditando(undefined)}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form
                noValidate
                onSubmit={(e) => void salvar(e)}
                className="grid gap-4 sm:grid-cols-2"
              >
                {campoFrete('propriedadeId', 'Propriedade *', (a) => (
                  <select
                    {...a}
                    required
                    disabled={Boolean(editando) || ocupado}
                    className={campo}
                    value={form.propriedadeId}
                    onChange={(e) => alterar('propriedadeId', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {propriedades.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                ))}

                {campoFrete('modal', 'Modal *', (a) => (
                  <select
                    {...a}
                    required
                    className={campo}
                    value={form.modal}
                    onChange={(e) =>
                      alterar('modal', e.target.value as ModalLogistica)
                    }
                  >
                    {MODAIS.map((m) => (
                      <option key={m.valor} value={m.valor}>
                        {m.texto}
                      </option>
                    ))}
                  </select>
                ))}

                {campoFrete('origem', 'Origem *', (a) => (
                  <input
                    {...a}
                    className={campo}
                    required
                    maxLength={150}
                    value={form.origem}
                    onChange={(e) => alterar('origem', e.target.value)}
                  />
                ))}

                {campoFrete('destino', 'Destino *', (a) => (
                  <input
                    {...a}
                    className={campo}
                    required
                    maxLength={150}
                    value={form.destino}
                    onChange={(e) => alterar('destino', e.target.value)}
                  />
                ))}

                {campoFrete('transportadora', 'Transportadora *', (a) => (
                  <input
                    {...a}
                    className={campo}
                    required
                    maxLength={150}
                    value={form.transportadora}
                    onChange={(e) => alterar('transportadora', e.target.value)}
                  />
                ))}

                {campoFrete('custo', 'Custo (R$) *', (a) => (
                  <input
                    {...a}
                    className={campo}
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.custo}
                    onChange={(e) => alterar('custo', e.target.value)}
                  />
                ))}

                {campoFrete(
                  'tempoEstimadoHoras',
                  'Tempo estimado (horas) *',
                  (a) => (
                    <input
                      {...a}
                      className={campo}
                      required
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.tempoEstimadoHoras}
                      onChange={(e) =>
                        alterar('tempoEstimadoHoras', e.target.value)
                      }
                    />
                  ),
                )}

                {campoFrete('situacao', 'Situação *', (a) => (
                  <select
                    {...a}
                    required
                    className={campo}
                    value={form.situacao}
                    onChange={(e) =>
                      alterar('situacao', e.target.value as SituacaoLogistica)
                    }
                  >
                    {SITUACOES.map((s) => (
                      <option key={s.valor} value={s.valor}>
                        {s.texto}
                      </option>
                    ))}
                  </select>
                ))}

                {campoFrete(
                  'exigeRefrigeracaoRapida',
                  'Exige refrigeração rápida?',
                  (a) => (
                    <select
                      {...a}
                      className={campo}
                      value={form.exigeRefrigeracaoRapida}
                      onChange={(e) =>
                        alterar('exigeRefrigeracaoRapida', e.target.value)
                      }
                    >
                      <option value="">Não informado</option>
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  ),
                )}

                <fieldset className="grid gap-3 rounded-xl border border-[#dce4df] p-3 sm:col-span-2 sm:grid-cols-2">
                  <legend className="px-1 text-sm font-semibold">
                    Medição de resfriamento
                  </legend>
                  <p className="text-xs text-[#526158] sm:col-span-2">
                    Quando houver medição, preencha os três campos. Os horários
                    são exibidos no fuso do dispositivo.
                  </p>
                  {campoFrete('colhidoEm', 'Data e hora da colheita', (a) => (
                    <input
                      {...a}
                      className={campo}
                      type="datetime-local"
                      step="0.001"
                      value={form.colhidoEm}
                      onChange={(e) => alterar('colhidoEm', e.target.value)}
                    />
                  ))}
                  {campoFrete(
                    'resfriadoEm',
                    'Data e hora do resfriamento',
                    (a) => (
                      <input
                        {...a}
                        className={campo}
                        type="datetime-local"
                        step="0.001"
                        value={form.resfriadoEm}
                        onChange={(e) =>
                          alterar('resfriadoEm', e.target.value)
                        }
                      />
                    ),
                  )}
                  {campoFrete(
                    'temperaturaResfriamentoC',
                    'Temperatura medida (°C)',
                    (a) => (
                      <input
                        {...a}
                        className={campo}
                        type="number"
                        step="any"
                        value={form.temperaturaResfriamentoC}
                        onChange={(e) =>
                          alterar('temperaturaResfriamentoC', e.target.value)
                        }
                      />
                    ),
                  )}
                </fieldset>

                {erro ? (
                  <div className="sm:col-span-2">
                    <FeedbackMessage variant="error">{erro}</FeedbackMessage>
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setEditando(undefined)}
                    className={botaoSecundario}
                    disabled={ocupado}
                  >
                    Cancelar
                  </button>
                  <button
                    className={botaoPrincipal}
                    disabled={ocupado}
                    type="submit"
                  >
                    {ocupado ? 'Salvando...' : 'Salvar transporte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {registroParaInativar ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-inativar-transporte-titulo"
          >
            <div className="w-full max-w-md rounded-2xl border border-[#e1e7e3] bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="modal-inativar-transporte-titulo"
                  className="text-lg font-semibold text-[#18251e]"
                >
                  Inativar transporte?
                </h2>
                <button
                  type="button"
                  onClick={() => setRegistroParaInativar(null)}
                  className="rounded-lg p-1.5 text-[#68756d] transition hover:bg-[#f3f6f4] hover:text-[#18251e] cursor-pointer"
                  aria-label="Fechar janela de confirmação"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#5f6d65]">
                Deseja inativar o frete de{' '}
                <strong className="font-semibold text-[#18251e]">
                  {registroParaInativar.origem}
                </strong>{' '}
                para{' '}
                <strong className="font-semibold text-[#18251e]">
                  {registroParaInativar.destino}
                </strong>
                ?
              </p>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegistroParaInativar(null)}
                  className={botaoSecundario}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarInativacao()}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
                >
                  Confirmar inativação
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  )
}