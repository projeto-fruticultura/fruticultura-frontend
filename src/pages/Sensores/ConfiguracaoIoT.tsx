import { useEffect, useState } from 'react'

import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import { loteService } from '@/services/loteService'

import type { PropriedadeResumo, Lote } from '@/types/api'

import { Cpu, Wifi, Settings } from 'lucide-react'

import { AppShell } from '@/components/app/AppShell'

export default function ConfiguracaoIoT() {
    const [mensagemValidacao, setMensagemValidacao] = useState('')
const [configuracaoValida, setConfiguracaoValida] = useState(false)
    const [canalId, setCanalId] = useState('')
const [apiKey, setApiKey] = useState('')
const [frequencia, setFrequencia] = useState('15')
const [profundidade, setProfundidade] = useState('30')
const [campoTemperatura, setCampoTemperatura] = useState('1')
const [campoUmidade, setCampoUmidade] = useState('2')
    const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
const [propriedadeSelecionada, setPropriedadeSelecionada] = useState('')

const [carregandoPropriedades, setCarregandoPropriedades] = useState(true)
const [erroPropriedades, setErroPropriedades] = useState('')

useEffect(() => {
  let ativo = true

  async function carregarPropriedades() {
    try {
      const dados = await propriedadeService.listar()

      if (ativo) {
        setPropriedades(dados)
      }
    } catch (erro) {
      if (ativo) {
        setErroPropriedades(
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível carregar as propriedades.',
        )
      }
    } finally {
      if (ativo) {
        setCarregandoPropriedades(false)
      }
    }
  }

  void carregarPropriedades()

  return () => {
    ativo = false
  }
}, [])

const [lotes, setLotes] = useState<Lote[]>([])
const [loteSelecionado, setLoteSelecionado] = useState('')

const [carregandoLotes, setCarregandoLotes] = useState(false)
const [erroLotes, setErroLotes] = useState('')

useEffect(() => {
  let ativo = true

  async function carregarLotes() {
    setLotes([])
    setLoteSelecionado('')
    setErroLotes('')

    if (!propriedadeSelecionada) {
      setCarregandoLotes(false)
      return
    }

    setCarregandoLotes(true)

    try {
      const dados = await loteService.listar(Number(propriedadeSelecionada))

      if (ativo) {
        setLotes(dados)
      }
    } catch (erro) {
      if (ativo) {
        setErroLotes(
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível carregar os lotes.',
        )
      }
    } finally {
      if (ativo) {
        setCarregandoLotes(false)
      }
    }
  }

  void carregarLotes()

  return () => {
    ativo = false
  }
}, [propriedadeSelecionada])

function validarConfiguracao() {
  setMensagemValidacao('')
  setConfiguracaoValida(false)

  if (!/^\d+$/.test(canalId.trim())) {
    setMensagemValidacao('Informe um ID de canal numérico válido.')
    return
  }

  if (!apiKey.trim()) {
    setMensagemValidacao('Informe a Read API Key.')
    return
  }

  if (!propriedadeSelecionada || !loteSelecionado) {
    setMensagemValidacao('Selecione uma propriedade e um lote.')
    return
  }

  if (!profundidade || Number(profundidade) <= 0) {
    setMensagemValidacao('Informe uma profundidade maior que zero.')
    return
  }

  if (campoTemperatura === campoUmidade) {
    setMensagemValidacao('Temperatura e umidade devem usar campos diferentes.')
    return
  }

  setConfiguracaoValida(true)
  setMensagemValidacao('Os dados foram validados. A configuração ainda precisa ser integrada ao servidor.')
}

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
              <Settings size={24} />
            </span>

            <div>
              <h1 className="text-2xl font-semibold text-[#18251e]">
                Configuração IoT
              </h1>

              <p className="mt-1 text-sm text-[#68756d]">
                Configure a conexão dos sensores com a plataforma ThingSpeak.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <Cpu className="text-[#15693E]" size={21} />
              <h2 className="text-lg font-semibold text-[#18251e]">
                Dados do canal ThingSpeak
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ID do canal
                </label>
                <input
  type="text"
  value={canalId}
  onChange={(evento) => setCanalId(evento.target.value)}
  placeholder="Ex.: 1234567"
  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
/>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Read API Key
                </label>
                <input
  type="password"
  value={apiKey}
  onChange={(evento) => setApiKey(evento.target.value)}
  placeholder="Informe a chave de leitura"
  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
/>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Frequência de envio
                </label>
                <select
                  value={frequencia}
onChange={(evento) => setFrequencia(evento.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="15">A cada 15 segundos</option>
                  <option value="30">A cada 30 segundos</option>
                  <option value="60">A cada 1 minuto</option>
                  <option value="300">A cada 5 minutos</option>
                </select>
              </div>
            </div>
            
<div className="mt-8 border-t border-gray-100 pt-6">
  <h3 className="mb-5 text-base font-semibold text-[#18251e]">
    Vínculo com a produção
  </h3>

  <div className="space-y-5">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Propriedade
      </label>
      <select
  value={propriedadeSelecionada}
  onChange={(evento) => setPropriedadeSelecionada(evento.target.value)}
  disabled={carregandoPropriedades}
  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
>
  <option value="">
    {carregandoPropriedades
      ? 'Carregando propriedades...'
      : 'Selecione uma propriedade'}
  </option>

  {propriedades.map((propriedade) => (
    <option key={propriedade.id} value={String(propriedade.id)}>
      {propriedade.nome}
    </option>
  ))}
</select>

{erroPropriedades && (
  <p className="mt-2 text-sm text-red-600">{erroPropriedades}</p>
)}
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Lote
      </label>
      <select
  value={loteSelecionado}
  onChange={(evento) => setLoteSelecionado(evento.target.value)}
  disabled={!propriedadeSelecionada || carregandoLotes}
  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
>
  <option value="">
    {!propriedadeSelecionada
      ? 'Selecione primeiro uma propriedade'
      : carregandoLotes
        ? 'Carregando lotes...'
        : 'Selecione um lote'}
  </option>

  {lotes.map((lote) => (
    <option key={lote.id} value={String(lote.id)}>
      {lote.identificacao}
    </option>
  ))}
</select>

{erroLotes && (
  <p className="mt-2 text-sm text-red-600">{erroLotes}</p>
)}
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Profundidade de instalação (cm)
      </label>
      <input
        type="number"
        min="0"
        placeholder="Ex.: 30"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
        value={profundidade}
onChange={(evento) => setProfundidade(evento.target.value)}
      />
    </div>
  </div>
</div>

<div className="mt-8 border-t border-gray-100 pt-6">
  <h3 className="mb-5 text-base font-semibold text-[#18251e]">
    Mapeamento dos campos
  </h3>

  <p className="mb-5 text-sm text-gray-500">
    Informe quais campos do canal ThingSpeak correspondem às informações
    enviadas pelos sensores.
  </p>

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Campo de temperatura
      </label>
      <select
  value={campoTemperatura}
  onChange={(evento) => setCampoTemperatura(evento.target.value)}
  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
>
        <option value="1">Field 1</option>
        <option value="2">Field 2</option>
        <option value="3">Field 3</option>
        <option value="4">Field 4</option>
        <option value="5">Field 5</option>
        <option value="6">Field 6</option>
        <option value="7">Field 7</option>
        <option value="8">Field 8</option>
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Campo de umidade
      </label>
      <select
  value={campoUmidade}
  onChange={(evento) => setCampoUmidade(evento.target.value)}
  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
>
        <option value="2">Field 2</option>
        <option value="1">Field 1</option>
        <option value="3">Field 3</option>
        <option value="4">Field 4</option>
        <option value="5">Field 5</option>
        <option value="6">Field 6</option>
        <option value="7">Field 7</option>
        <option value="8">Field 8</option>
      </select>
    </div>
  </div>

  <div className="mt-8 border-t border-gray-100 pt-6">
  <button
    type="button"
    onClick={validarConfiguracao}
    className="w-full rounded-xl bg-[#15693E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#105331]"
  >
    Validar configuração
  </button>

  {mensagemValidacao && (
    <p
      className={`mt-3 text-sm ${
        configuracaoValida ? 'text-green-700' : 'text-red-600'
      }`}
    >
      {mensagemValidacao}
    </p>
  )}
</div>
</div>

          </section>

          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wifi className="text-[#15693E]" size={21} />
              <h2 className="text-lg font-semibold text-[#18251e]">
                Status da conexão
              </h2>
            </div>

            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Não testada
            </span>

            <p className="mt-4 text-sm text-gray-500">
              A conexão ainda não foi testada.
            </p>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Último payload recebido
              </p>

              <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
{`{
  "status": "Aguardando dados"
}`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
