import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Pencil, Plus, RefreshCw, Truck, X } from 'lucide-react'
import { AppShell, PageBreadcrumb } from '@/components/app/AppShell'
import { CabecalhoProdutor, Campo, EstadoVazio, botao, botaoSecundario, campo, cartao } from '@/components/app/produtor/ProdutorUi'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarMoeda, formatarNumero } from '@/lib/formatar'
import { avaliarCadeiaFrio, type SituacaoFrio } from '@/lib/indicadoresProdutor'
import { ApiError } from '@/services/api'
import { logisticaService } from '@/services/logisticaService'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadeResumo } from '@/types/api'
import type { LogisticaPayload, LogisticaRegistro, ModalLogistica, SituacaoLogistica } from '@/types/logistica'

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
  SEM_EXIGENCIA: { texto: 'Sem exigência informada', estilo: 'bg-slate-100 text-slate-700' },
  PENDENTE: { texto: 'Cadeia do frio: verificação pendente', estilo: 'bg-amber-100 text-amber-900' },
  CONFORME: { texto: 'Resfriamento informado dentro da janela', estilo: 'bg-emerald-100 text-emerald-900' },
  ATENCAO: { texto: 'Atenção: fora da janela de resfriamento', estilo: 'bg-red-100 text-red-900' },
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
}

const vazio: CamposForm = { propriedadeId: '', origem: '', destino: '', modal: 'RODOVIARIO', transportadora: '', custo: '', situacao: 'PLANEJADA', tempoEstimadoHoras: '' }

function dadosFormulario(registro: LogisticaRegistro): CamposForm {
  return {
    propriedadeId: registro.propriedadeId === null ? '' : String(registro.propriedadeId),
    origem: registro.origem,
    destino: registro.destino,
    modal: MODAIS.some((m) => m.valor === registro.modal) ? registro.modal as ModalLogistica : 'RODOVIARIO',
    transportadora: registro.transportadora ?? '',
    custo: registro.custo === null ? '' : String(registro.custo),
    situacao: registro.situacao,
    tempoEstimadoHoras: registro.tempoEstimadoHoras === null ? '' : String(registro.tempoEstimadoHoras),
  }
}

function validar(form: CamposForm, propriedades: PropriedadeResumo[]): LogisticaPayload {
  const propriedadeId = Number(form.propriedadeId)
  const custo = Number(form.custo)
  const horas = form.tempoEstimadoHoras.trim() ? Number(form.tempoEstimadoHoras) : null
  if (!propriedades.some((p) => p.id === propriedadeId)) throw new Error('Selecione uma propriedade autorizada.')
  if (!form.origem.trim() || !form.destino.trim()) throw new Error('Origem e destino são obrigatórios.')
  if (form.custo.trim() === '' || !Number.isFinite(custo) || custo < 0) throw new Error('Informe um custo válido (zero ou maior).')
  if (horas !== null && (!Number.isFinite(horas) || horas < 0)) throw new Error('Informe um tempo estimado válido.')
  return { propriedadeId, origem: form.origem.trim(), destino: form.destino.trim(), modal: form.modal, transportadora: form.transportadora.trim() || null, custo, situacao: form.situacao, tempoEstimadoHoras: horas }
}

function mensagemErro(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível concluir a operação.' }

export default function Logistica() {
  const [registros, setRegistros] = useState<LogisticaRegistro[]>([])
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [filtroPropriedade, setFiltroPropriedade] = useState('')
  const [filtroModal, setFiltroModal] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [editando, setEditando] = useState<LogisticaRegistro | null | undefined>(undefined)
  const [form, setForm] = useState<CamposForm>(vazio)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const [fretes, props] = await Promise.all([logisticaService.listar(), propriedadeService.listar()])
        if (ativo) { setRegistros(fretes); setPropriedades(props) }
      } catch (e) {
        if (ativo) setErro(mensagemErro(e))
      } finally { if (ativo) setCarregando(false) }
    }
    void carregar()
    return () => { ativo = false }
  }, [versao])

  const visiveis = useMemo(() => registros.filter((r) =>
    (!filtroPropriedade || String(r.propriedadeId) === filtroPropriedade)
    && (!filtroModal || r.modal === filtroModal)
    && (!filtroSituacao || r.situacao === filtroSituacao),
  ), [registros, filtroPropriedade, filtroModal, filtroSituacao])
  const nomes = useMemo(() => new Map(propriedades.map((p) => [p.id, p.nome])), [propriedades])

  function abrirNovo() {
    setErro('')
    setForm({ ...vazio, propriedadeId: propriedades.length === 1 ? String(propriedades[0].id) : '' })
    setEditando(null)
  }

  function abrirEdicao(registro: LogisticaRegistro) {
    if (!registro.propriedadeId || !nomes.has(registro.propriedadeId)) {
      setErro('Este registro não informa uma propriedade autorizada para edição.')
      return
    }
    if (!MODAIS.some((m) => m.valor === registro.modal)) {
      setErro('O modal deste registro não é reconhecido pelo formulário atual.')
      return
    }
    setErro('')
    setForm(dadosFormulario(registro))
    setEditando(registro)
  }

  function alterar<K extends keyof CamposForm>(chave: K, valor: CamposForm[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }))
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setSucesso('')
    let payload: LogisticaPayload
    try { payload = validar(form, propriedades) } catch (e) { setErro(mensagemErro(e)); return }
    setOcupado(true)
    try {
      if (editando) await logisticaService.atualizar(editando.id, payload)
      else await logisticaService.criar(payload)
      setEditando(undefined)
      setSucesso(editando ? 'Planejamento de transporte atualizado.' : 'Planejamento de transporte cadastrado.')
      setVersao((v) => v + 1)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : mensagemErro(e))
    } finally { setOcupado(false) }
  }

  async function inativar(registro: LogisticaRegistro) {
    if (!window.confirm(`Deseja inativar o frete de ${registro.origem} para ${registro.destino}?`)) return
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      await logisticaService.remover(registro.id)
      setSucesso('Solicitação de inativação concluída.')
      setVersao((v) => v + 1)
    } catch (e) { setErro(mensagemErro(e)) }
    finally { setOcupado(false) }
  }

  return <AppShell section="logistica">
    <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
      <PageBreadcrumb items={[{ label: 'Painel', to: '/painel' }, { label: 'Logística' }]} />
      <CabecalhoProdutor titulo="Logística e escoamento" descricao="Gerencie o transporte da produção com custos, rotas, situação e requisitos de resfriamento." acao={
        <div className="flex flex-wrap gap-2"><button type="button" className={botaoSecundario} onClick={() => setVersao((v) => v + 1)} disabled={carregando || ocupado}><RefreshCw size={16}/> Atualizar</button>
          <button type="button" className={botao} onClick={abrirNovo} disabled={carregando || ocupado || propriedades.length === 0}><Plus size={16}/> Novo transporte</button></div>
      } />
      {erro ? <div className="mb-4"><FeedbackMessage variant="error">{erro}</FeedbackMessage></div> : null}
      {sucesso ? <div className="mb-4"><FeedbackMessage variant="success">{sucesso}</FeedbackMessage></div> : null}
      <section className={cartao} aria-labelledby="filtros-logistica">
        <h2 id="filtros-logistica" className="mb-4 text-base font-semibold text-[#1d2b23]">Filtrar transportes</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Propriedade"><select className={campo} value={filtroPropriedade} onChange={(e) => setFiltroPropriedade(e.target.value)}><option value="">Todas</option>{propriedades.map((p) => <option value={p.id} key={p.id}>{p.nome}</option>)}</select></Campo>
          <Campo rotulo="Modal"><select className={campo} value={filtroModal} onChange={(e) => setFiltroModal(e.target.value)}><option value="">Todos</option>{MODAIS.map((m) => <option value={m.valor} key={m.valor}>{m.texto}</option>)}</select></Campo>
          <Campo rotulo="Situação"><select className={campo} value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}><option value="">Todas</option>{SITUACOES.map((s) => <option value={s.valor} key={s.valor}>{s.texto}</option>)}</select></Campo>
        </div>
      </section>
      <section className={`${cartao} mt-4`} aria-labelledby="lista-logistica">
        <h2 id="lista-logistica" className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1d2b23]"><Truck size={18} className="text-[#168150]"/> Transportes <span className="text-sm font-normal text-[#7a8780]">({visiveis.length})</span></h2>
        {carregando ? <p role="status" className="text-sm">Carregando transportes...</p> : erro && registros.length === 0 ? <EstadoVazio>Não foi possível carregar os registros. Tente atualizar.</EstadoVazio> : visiveis.length === 0 ? <EstadoVazio>Nenhum transporte cadastrado para os filtros selecionados.</EstadoVazio> :
          <div className="overflow-x-auto rounded-xl border border-[#e6ece8]">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <caption className="sr-only">Lista de transportes da produção</caption>
              <thead className="bg-[#f3f7f4] text-[#435249]"><tr>
                <th scope="col" className="px-4 py-3">Propriedade / origem</th><th scope="col" className="px-4 py-3">Destino</th><th scope="col" className="px-4 py-3">Modal / transportadora</th><th scope="col" className="px-4 py-3">Custo / tempo</th><th scope="col" className="px-4 py-3">Situação / frio</th><th scope="col" className="px-4 py-3">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-[#edf1ee]">{visiveis.map((r) => {
                const frio = cadeiaFrio[avaliarCadeiaFrio(r)]
                return <tr key={r.id} className="align-top text-[#2d3a33]">
                  <td className="px-4 py-3"><span className="font-semibold">{r.propriedadeId ? nomes.get(r.propriedadeId) ?? `Propriedade #${r.propriedadeId}` : 'Propriedade não informada'}</span><p className="mt-1 text-xs text-[#78877e]">{r.origem}</p></td>
                  <td className="px-4 py-3">{r.destino}</td>
                  <td className="px-4 py-3">{MODAIS.find((m) => m.valor === r.modal)?.texto ?? r.modal}<p className="mt-1 text-xs text-[#78877e]">{r.transportadora ?? 'Sem transportadora'}</p></td>
                  <td className="px-4 py-3">{r.custo === null ? 'Não informado' : formatarMoeda(r.custo)}<p className="mt-1 text-xs text-[#78877e]">{r.tempoEstimadoHoras === null ? 'Tempo não informado' : `${formatarNumero(r.tempoEstimadoHoras)} h estimadas`}</p></td>
                  <td className="px-4 py-3"><span className="font-medium">{SITUACOES.find((s) => s.valor === r.situacao)?.texto}</span><p className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${frio.estilo}`}>{avaliarCadeiaFrio(r) === 'ATENCAO' ? <AlertTriangle size={12} aria-hidden="true"/> : null}{frio.texto}</p></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" disabled={ocupado} onClick={() => abrirEdicao(r)} className="rounded-lg border border-[#dce4df] p-2 text-[#087a49] hover:bg-[#f6faf7] focus-visible:ring-2 focus-visible:ring-[#009B4D]" aria-label={`Editar transporte ${r.id}`}><Pencil size={16}/></button>
                    <button type="button" disabled={ocupado} onClick={() => void inativar(r)} className="rounded-lg border border-[#dce4df] p-2 text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500" aria-label={`Inativar transporte ${r.id}`}><X size={16}/></button></div></td>
                </tr>
              })}</tbody>
            </table>
          </div>}
        <p className="mt-4 text-xs leading-5 text-[#7a8780]">Atenção: cargas com exigência de cadeia do frio precisam ser resfriadas em menos de 6 horas, entre 0°C e 10°C. Sem registros de medição, a conformidade não pode ser confirmada. O sistema não realiza rastreamento GPS.</p>
      </section>
      {editando !== undefined ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3" role="dialog" aria-modal="true" aria-labelledby="form-transporte-title">
        <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="form-transporte-title" className="text-lg font-semibold text-[#1d2b23]">{editando ? 'Editar transporte' : 'Cadastrar transporte'}</h2><p className="mt-1 text-xs text-[#7a8780]">Preencha o planejamento com as informações da transportadora.</p></div>
            <button type="button" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Fechar formulário" onClick={() => setEditando(undefined)}><X size={20}/></button></div>
          <form onSubmit={(e) => void salvar(e)} className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Propriedade *"><select required className={campo} value={form.propriedadeId} onChange={(e) => alterar('propriedadeId', e.target.value)}><option value="">Selecione</option>{propriedades.map((p) => <option value={p.id} key={p.id}>{p.nome}</option>)}</select></Campo>
            <Campo rotulo="Modal *"><select required className={campo} value={form.modal} onChange={(e) => alterar('modal', e.target.value as ModalLogistica)}>{MODAIS.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}</select></Campo>
            <Campo rotulo="Origem *"><input className={campo} required maxLength={160} value={form.origem} onChange={(e) => alterar('origem', e.target.value)}/></Campo>
            <Campo rotulo="Destino *"><input className={campo} required maxLength={160} value={form.destino} onChange={(e) => alterar('destino', e.target.value)}/></Campo>
            <Campo rotulo="Transportadora"><input className={campo} maxLength={160} value={form.transportadora} onChange={(e) => alterar('transportadora', e.target.value)}/></Campo>
            <Campo rotulo="Custo (R$) *"><input className={campo} required inputMode="decimal" type="number" min="0" step="0.01" value={form.custo} onChange={(e) => alterar('custo', e.target.value)}/></Campo>
            <Campo rotulo="Tempo estimado (horas)"><input className={campo} inputMode="decimal" type="number" min="0" step="0.1" value={form.tempoEstimadoHoras} onChange={(e) => alterar('tempoEstimadoHoras', e.target.value)}/></Campo>
            <Campo rotulo="Situação"><select className={campo} value={form.situacao} onChange={(e) => alterar('situacao', e.target.value as SituacaoLogistica)}>{SITUACOES.map((s) => <option key={s.valor} value={s.valor}>{s.texto}</option>)}</select></Campo>
            {erro ? <div className="sm:col-span-2"><FeedbackMessage variant="error">{erro}</FeedbackMessage></div> : null}
            <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditando(undefined)} className={botaoSecundario} disabled={ocupado}>Cancelar</button><button className={botao} disabled={ocupado} type="submit">{ocupado ? 'Salvando...' : 'Salvar transporte'}</button></div>
          </form>
        </div>
      </div> : null}
    </main>
  </AppShell>
}
