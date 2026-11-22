import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Campo, botao, botaoSecundario, campo } from './ProdutorUi'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarDataHora } from '@/lib/formatar'
import { ApiError, apiRequest } from '@/services/api'
import { logisticaService } from '@/services/logisticaService'
import type { Lote, Sensor } from '@/types/api'

interface ResultadoJanelas {
  calculadoEm: string
  parametros: { fonte: string; versao: string }
  previsao: { fonte: string }
  coordenadasUtilizadas: { estimadasUf?: boolean }
  colheita: {
    status: string
    motivos: string[]
    janelas: { inicio: string; fim: string }[]
  }
  exportacao: {
    status: string
    motivos: string[]
    janelas: { embarqueInicio: string; embarqueFim: string }[]
  }
  avisos: string[]
}

const parametrosColheita = [
  ['grausDiaReferencia', 'Graus-dia acumulados na referência', 0, 100000],
  ['temperaturaBase', 'Temperatura-base (°C)', -10, 60],
  ['grausDiaAlvo', 'Graus-dia alvo', 1, 100000],
  ['chuvaMaxMm', 'Chuva máxima diária (mm)', 0, 1000],
  ['umidadeArMaxPercentual', 'Umidade máxima do ar (%)', 0, 100],
] as const

const parametrosExportacao = [
  ['horasAteResfriamento', 'Horas previstas até o resfriamento', 0, 1000],
  ['vidaUtilHoras', 'Vida útil da carga (horas)', 0.01, 10000],
  ['precoInternoKg', 'Preço interno (R$/kg)', 0, 100000],
  ['precoExportacaoKg', 'Preço de exportação (R$/kg)', 0, 100000],
  ['custoInternoKg', 'Custo interno (R$/kg)', 0, 100000],
  ['custoExportacaoKg', 'Custo de exportação (R$/kg)', 0, 100000],
] as const

const statusJanela: Record<string, string> = {
  FAVORAVEL: 'Condições favoráveis',
  DADOS_INSUFICIENTES: 'Dados insuficientes',
  SEM_JANELA_NO_HORIZONTE: 'Sem janela favorável nos próximos 7 dias',
  SEM_JANELA_COLHEITA: 'Sem janela de colheita disponível',
  NAO_FAVORAVEL: 'Condições desfavoráveis',
}

function ResultadoJanela({ titulo, status, motivos, janelas }: {
  titulo: string
  status: string
  motivos: string[]
  janelas: { inicio: string; fim: string }[]
}) {
  return <div className="rounded-xl bg-[#f6f9f7] p-4">
    <h3 className="text-sm font-semibold">{titulo}</h3>
    <p className="mt-1 text-sm">{statusJanela[status] ?? 'Resultado indisponível'}</p>
    {janelas.length ? <ul className="mt-2 space-y-1 text-sm">
      {janelas.map(({ inicio, fim }) => <li key={inicio}>{formatarDataHora(inicio)} a {formatarDataHora(fim)}</li>)}
    </ul> : null}
    {motivos.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[#526158]">
      {motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
    </ul> : null}
  </div>
}

function SelecaoRota({ propriedadeId, erro }: { propriedadeId: number; erro?: string }) {
  const [pagina, setPagina] = useState(1)
  const [revisao, setRevisao] = useState(0)
  const chave = `${propriedadeId}-${pagina}-${revisao}`
  const [consulta, setConsulta] = useState<{
    chave: string
    dados: Awaited<ReturnType<typeof logisticaService.listar>> | null
  }>()

  useEffect(() => {
    let ativo = true
    void logisticaService.listar({ propriedadeId, pagina })
      .then((dados) => {
        if (!ativo) return
        const ultimaPagina = Math.max(1, dados.paginacao.totalPaginas)
        if (pagina > ultimaPagina) setPagina(ultimaPagina)
        else setConsulta({ chave, dados })
      })
      .catch(() => { if (ativo) setConsulta({ chave, dados: null }) })
    return () => { ativo = false }
  }, [chave, propriedadeId, pagina])

  const atual = consulta?.chave === chave ? consulta : null
  const carregada = atual?.dados
  const falhou = atual?.dados === null
  const total = carregada?.paginacao.totalPaginas ?? 0

  return <div className="sm:col-span-2">
    <Campo rotulo="Rota da propriedade" erro={erro} erroId="erro-janela-rota">
      <select name="rotaLogisticaId" key={pagina} className={campo} defaultValue="" required
        aria-invalid={Boolean(erro)} aria-describedby={erro ? 'erro-janela-rota' : undefined}>
        <option value="">{falhou ? 'Rotas indisponíveis' : !carregada ? 'Carregando rotas…' : 'Selecione a rota'}</option>
        {carregada?.dados.map((rota) => <option key={rota.id} value={rota.id}>
          {rota.origem} → {rota.destino} · {rota.transportadora}
        </option>)}
      </select>
    </Campo>
    {falhou ? <button type="button" className={`${botaoSecundario} mt-2`} onClick={() => setRevisao((n) => n + 1)}>Tentar novamente</button> : null}
    {carregada && total === 0 ? <Link className="mt-2 inline-block text-sm font-semibold text-[#087a49]" to="/logistica">Cadastre uma rota em Logística</Link> : null}
    {total > 1 ? <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" className={botaoSecundario} disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Rotas anteriores</button>
      <span className="text-xs">Página {pagina} de {total}</span>
      <button type="button" className={botaoSecundario} disabled={pagina >= total} onClick={() => setPagina(pagina + 1)}>Próximas rotas</button>
    </div> : null}
  </div>
}

function FormJanelas({ lote, sensores }: { lote: Lote; sensores: Sensor[] }) {
  const [hojeUtc] = useState(() => new Date().toISOString().slice(0, 10))
  const [incluirExportacao, setIncluirExportacao] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoJanelas>()
  const [erro, setErro] = useState('')
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({})
  const requisicao = useRef<AbortController | null>(null)
  useEffect(() => () => requisicao.current?.abort(), [])

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dados = new FormData(event.currentTarget)
    const texto = (nome: string) => String(dados.get(nome) ?? '').trim()
    const numero = (nome: string) => Number(texto(nome))
    const cotacaoMs = Date.parse(texto('dataHoraCotacao'))
    if (incluirExportacao && !Number.isFinite(cotacaoMs)) {
      setErrosCampos({ dataHoraCotacao: 'Informe a data e a hora da cotação.' })
      setResultado(undefined)
      return
    }
    const payload = {
      sensorId: numero('sensorId'),
      dataHoraReferencia: `${texto('dataHoraReferencia')}T00:00:00.000Z`,
      ...Object.fromEntries(parametrosColheita.map(([nome]) => [nome, numero(nome)])),
      fonteParametros: texto('fonteParametros'),
      versaoParametros: texto('versaoParametros'),
      ...(incluirExportacao ? {
        rotaLogisticaId: numero('rotaLogisticaId'),
        ...Object.fromEntries(parametrosExportacao.map(([nome]) => [nome, numero(nome)])),
        cadeiaFrioGarantida: texto('cadeiaFrioGarantida') === 'true',
        moeda: 'BRL',
        dataHoraCotacao: new Date(cotacaoMs).toISOString(),
        fonteCotacao: texto('fonteCotacao'),
      } : {}),
    }

    requisicao.current?.abort()
    const controller = new AbortController()
    requisicao.current = controller
    setCarregando(true)
    setResultado(undefined)
    setErro('')
    setErrosCampos({})
    try {
      const resposta = await apiRequest<ResultadoJanelas>(`/lotes/${lote.id}/janelas`, {
        method: 'POST', body: JSON.stringify(payload), signal: controller.signal,
      })
      if (!controller.signal.aborted) setResultado(resposta)
    } catch (error) {
      if (controller.signal.aborted) return
      setErro(error instanceof Error ? error.message : 'Não foi possível calcular as janelas.')
      if (error instanceof ApiError && error.campos) setErrosCampos(error.campos)
    } finally {
      if (!controller.signal.aborted) setCarregando(false)
    }
  }

  function input(nome: string, rotulo: string, tipo = 'text', limites: { min?: number; max?: number | string } = {}) {
    const erroId = `erro-janela-${nome}`
    return <Campo key={nome} rotulo={rotulo} erro={errosCampos[nome]} erroId={erroId}>
      <input name={nome} required className={campo} type={tipo} {...limites}
        step={tipo === 'number' ? 'any' : undefined} maxLength={tipo === 'text' ? 200 : undefined}
        aria-invalid={Boolean(errosCampos[nome])} aria-describedby={errosCampos[nome] ? erroId : undefined} />
    </Campo>
  }

  if (!sensores.length) return <p className="mt-3 text-sm text-[#526158]">Vincule um sensor ativo ao lote para calcular as janelas.</p>

  return <>
    <form className="mt-3 space-y-3" onSubmit={(e) => void consultar(e)}>
      <fieldset disabled={carregando} className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Sensor de referência" erro={errosCampos.sensorId} erroId="erro-janela-sensor">
          <select name="sensorId" className={campo} defaultValue={sensores.length === 1 ? sensores[0].id : ''} required
            aria-invalid={Boolean(errosCampos.sensorId)} aria-describedby={errosCampos.sensorId ? 'erro-janela-sensor' : undefined}>
            <option value="">Selecione</option>
            {sensores.map((sensor) => <option key={sensor.id} value={sensor.id}>{sensor.codigo}</option>)}
          </select>
        </Campo>
        {input('dataHoraReferencia', 'Data de referência (00:00 UTC)', 'date', { max: hojeUtc })}
        {parametrosColheita.map(([nome, rotulo, min, max]) => input(nome, rotulo, 'number', { min, max }))}
        {input('fonteParametros', 'Fonte dos parâmetros')}
        {input('versaoParametros', 'Versão dos parâmetros')}
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={incluirExportacao} onChange={(e) => setIncluirExportacao(e.target.checked)} />
          Calcular janela de exportação
        </label>
        {incluirExportacao ? <>
          <SelecaoRota propriedadeId={lote.propriedadeId} erro={errosCampos.rotaLogisticaId} />
          {parametrosExportacao.map(([nome, rotulo, min, max]) => input(nome, rotulo, 'number', { min, max }))}
          <Campo rotulo="Cadeia do frio garantida?" erro={errosCampos.cadeiaFrioGarantida} erroId="erro-janela-cadeia">
            <select className={campo} name="cadeiaFrioGarantida" defaultValue="" required
              aria-invalid={Boolean(errosCampos.cadeiaFrioGarantida)} aria-describedby={errosCampos.cadeiaFrioGarantida ? 'erro-janela-cadeia' : undefined}>
              <option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option>
            </select>
          </Campo>
          {input('dataHoraCotacao', 'Data e hora da cotação (horário local)', 'datetime-local')}
          {input('fonteCotacao', 'Fonte da cotação')}
        </> : null}
      </fieldset>
      <button type="submit" className={botao} disabled={carregando}>{carregando ? 'Calculando…' : 'Calcular janelas'}</button>
    </form>
    {erro ? <div className="mt-3"><FeedbackMessage variant="error">{erro}</FeedbackMessage></div> : null}
    {resultado ? <div className="mt-4 space-y-3" aria-live="polite">
      <ResultadoJanela titulo="Janela recomendada de colheita" {...resultado.colheita} />
      <ResultadoJanela titulo="Janela recomendada de exportação" {...resultado.exportacao}
        janelas={resultado.exportacao.janelas.map(({ embarqueInicio, embarqueFim }) => ({ inicio: embarqueInicio, fim: embarqueFim }))} />
      {resultado.coordenadasUtilizadas?.estimadasUf ? <FeedbackMessage variant="info">Coordenadas estimadas por região</FeedbackMessage> : null}
      <p className="text-xs leading-5 text-[#526158]">
        Cálculo em {formatarDataHora(resultado.calculadoEm)} · Previsão de {resultado.previsao.fonte} · Parâmetros de {resultado.parametros.fonte}, versão {resultado.parametros.versao}.
      </p>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-[#526158]">
        {resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
      </ul>
    </div> : null}
  </>
}

export function JanelasProdutor({ lotes, sensores }: { lotes: Lote[]; sensores: Sensor[] }) {
  const [loteId, setLoteId] = useState('')
  const ativos = lotes.filter(({ status }) => status === 'ATIVO')
  const lote = ativos.find(({ id }) => String(id) === loteId)
  const sensoresDoLote = sensores.filter((sensor) => sensor.loteId === lote?.id && sensor.status === 'ATIVO')

  return <details className="mt-4 rounded-xl border border-[#dce4df] p-3">
    <summary className="cursor-pointer text-sm font-semibold text-[#087a49]">Consultar janelas de colheita e exportação</summary>
    <p className="my-3 text-xs leading-5 text-[#526158]">Use parâmetros de referência validados para a cultura e variedade do lote.</p>
    <Campo rotulo="Lote">
      <select className={campo} value={lote?.id ?? ''} onChange={(e) => setLoteId(e.target.value)} disabled={!ativos.length}>
        <option value="">{ativos.length ? 'Selecione o lote' : 'Nenhum lote ativo disponível'}</option>
        {ativos.map(({ id, identificacao, cultura }) => <option key={id} value={id}>{identificacao} · {cultura.nome}</option>)}
      </select>
    </Campo>
    {lote ? <FormJanelas key={lote.id} lote={lote} sensores={sensoresDoLote} /> : null}
  </details>
}
