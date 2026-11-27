import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { ApiError } from '@/services/api'
import { loteService } from '@/services/loteService'
import { propriedadeService } from '@/services/propriedadeService'
import type { Lote, PropriedadeResumo } from '@/types/api'

const ROTULOS_FREQUENCIA: Record<string, string> = {
  '15': 'A cada 15 segundos',
  '30': 'A cada 30 segundos',
  '60': 'A cada 1 minuto',
  '300': 'A cada 5 minutos',
}

export default function ConfiguracaoIoT() {
  const formId = useId()

  const [mensagemValidacao, setMensagemValidacao] = useState('')
  const [configuracaoValida, setConfiguracaoValida] = useState(false)

  const [canalId, setCanalId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [mostrarApiKey, setMostrarApiKey] = useState(false)
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
      setMensagemValidacao(
        'Temperatura e umidade devem usar campos diferentes.',
      )
      return
    }

    setConfiguracaoValida(true)
    setMensagemValidacao(
      'Os dados foram validados. A configuração ainda precisa ser integrada ao servidor.',
    )
  }

  const fields = {
    canalId: `${formId}-canal-id`,
    apiKey: `${formId}-api-key`,
    frequencia: `${formId}-frequencia`,
    propriedade: `${formId}-propriedade`,
    lote: `${formId}-lote`,
    profundidade: `${formId}-profundidade`,
    campoTemperatura: `${formId}-campo-temperatura`,
    campoUmidade: `${formId}-campo-umidade`,
  }

  const propriedadeAtual = propriedades.find(
    (item) => String(item.id) === propriedadeSelecionada,
  )
  const loteAtual = lotes.find((item) => String(item.id) === loteSelecionado)

  const payloadPreview = JSON.stringify(
    {
      channel_id: canalId.trim() ? Number(canalId.trim()) || canalId.trim() : null,
      intervalo_segundos: Number(frequencia),
      mapeamento: {
        [`field${campoTemperatura}`]: 'temperatura',
        [`field${campoUmidade}`]: 'umidade',
      },
      status: configuracaoValida ? 'Validado localmente' : 'Aguardando dados',
    },
    null,
    2,
  )

  return (
    <AppShell section="iot">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        {/* Cabeçalho padronizado */}
        <section className="mb-6 overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="border-l-[7px] border-[#009B4D] px-5 py-6 sm:px-7">
            <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
              Configuração IoT
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
              Integrar sensores ao ThingSpeak e vincular a telemetria aos lotes monitorados.
            </p>
          </div>
        </section>

        {mensagemValidacao ? (
          <div className="mb-5">
            <FeedbackMessage variant={configuracaoValida ? 'success' : 'error'}>
              {mensagemValidacao}
            </FeedbackMessage>
          </div>
        ) : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
          {/* Coluna esquerda: parâmetros estruturados */}
          <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-7">
            <div className="space-y-6">
              <div className="border-b border-[#edf2ee] pb-5">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#18251e]">
                  Parâmetros de integração
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#68756d]">
                  Preencha as credenciais do canal, o destino produtivo e os
                  campos correspondentes às medições.
                </p>
              </div>

              {/* Grupo 1: Dados do canal ThingSpeak */}
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Dados do canal ThingSpeak
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="ID do canal"
                    required
                    htmlFor={fields.canalId}
                  >
                    <input
                      id={fields.canalId}
                      type="text"
                      inputMode="numeric"
                      value={canalId}
                      onChange={(evento) => setCanalId(evento.target.value)}
                      placeholder="Ex.: 1234567"
                      className={`${inputClass()} font-mono tabular-nums`}
                    />
                  </Field>

                  <Field
                    label="Frequência de envio"
                    required
                    htmlFor={fields.frequencia}
                  >
                    <select
                      id={fields.frequencia}
                      value={frequencia}
                      onChange={(evento) => setFrequencia(evento.target.value)}
                      className={inputClass()}
                    >
                      <option value="15">A cada 15 segundos</option>
                      <option value="30">A cada 30 segundos</option>
                      <option value="60">A cada 1 minuto</option>
                      <option value="300">A cada 5 minutos</option>
                    </select>
                  </Field>

                  <Field
                    label="Read API Key"
                    required
                    htmlFor={fields.apiKey}
                    className="sm:col-span-2"
                  >
                    <div className="relative">
                      <input
                        id={fields.apiKey}
                        type={mostrarApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(evento) => setApiKey(evento.target.value)}
                        placeholder="Informe a chave de leitura do canal"
                        className={`${inputClass()} pr-12 font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarApiKey((atual) => !atual)}
                        aria-label={
                          mostrarApiKey
                            ? 'Ocultar Read API Key'
                            : 'Mostrar Read API Key'
                        }
                        className="absolute inset-y-2 right-2 flex w-9 cursor-pointer items-center justify-center rounded-lg text-[#68756d] transition hover:bg-[#f0f5f2] hover:text-[#18251e]"
                      >
                        {mostrarApiKey ? (
                          <EyeOff size={17} aria-hidden="true" />
                        ) : (
                          <Eye size={17} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Grupo 2: Vínculo com a produção */}
              <div className="space-y-4 border-t border-[#edf2ee] pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Vínculo com a produção
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Propriedade"
                    required
                    error={erroPropriedades}
                    htmlFor={fields.propriedade}
                  >
                    <select
                      id={fields.propriedade}
                      value={propriedadeSelecionada}
                      onChange={(evento) =>
                        setPropriedadeSelecionada(evento.target.value)
                      }
                      disabled={carregandoPropriedades}
                      className={`${inputClass()} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
                    >
                      <option value="">
                        {carregandoPropriedades
                          ? 'Carregando propriedades...'
                          : 'Selecione uma propriedade'}
                      </option>

                      {propriedades.map((propriedade) => (
                        <option
                          key={propriedade.id}
                          value={String(propriedade.id)}
                        >
                          {propriedade.nome}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Lote"
                    required
                    error={erroLotes}
                    htmlFor={fields.lote}
                  >
                    <select
                      id={fields.lote}
                      value={loteSelecionado}
                      onChange={(evento) =>
                        setLoteSelecionado(evento.target.value)
                      }
                      disabled={!propriedadeSelecionada || carregandoLotes}
                      className={`${inputClass()} disabled:cursor-not-allowed disabled:bg-[#f2f5f3] disabled:text-[#68756d]`}
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
                  </Field>

                  <Field
                    label="Profundidade de instalação"
                    required
                    htmlFor={fields.profundidade}
                    className="sm:col-span-2"
                  >
                    <div className="relative">
                      <input
                        id={fields.profundidade}
                        type="number"
                        min="0"
                        placeholder="Ex.: 30"
                        value={profundidade}
                        onChange={(evento) =>
                          setProfundidade(evento.target.value)
                        }
                        className={`${inputClass()} pr-12 tabular-nums`}
                      />
                      <span className="pointer-events-none absolute inset-y-2.5 right-0 flex w-10 items-center justify-center border-l border-[#edf2ee] text-xs font-semibold text-[#6e7c74]">
                        cm
                      </span>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Grupo 3: Mapeamento dos campos */}
              <div className="space-y-4 border-t border-[#edf2ee] pt-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                    Mapeamento dos campos
                  </p>
                  <p className="mt-1 text-sm text-[#68756d]">
                    Associe os campos do canal ThingSpeak às variáveis
                    climáticas coletadas.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Campo de temperatura"
                    required
                    htmlFor={fields.campoTemperatura}
                  >
                    <select
                      id={fields.campoTemperatura}
                      value={campoTemperatura}
                      onChange={(evento) =>
                        setCampoTemperatura(evento.target.value)
                      }
                      className={inputClass()}
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
                  </Field>

                  <Field
                    label="Campo de umidade"
                    required
                    htmlFor={fields.campoUmidade}
                  >
                    <select
                      id={fields.campoUmidade}
                      value={campoUmidade}
                      onChange={(evento) =>
                        setCampoUmidade(evento.target.value)
                      }
                      className={inputClass()}
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
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* Coluna direita: status da conexão, payload e validação */}
          <aside>
            <section className="rounded-[24px] border border-[#e1e7e3] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Status da conexão
                </p>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    configuracaoValida
                      ? 'bg-[#edf7f1] text-[#15693E]'
                      : 'bg-[#f2f5f3] text-[#5c6b63]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      configuracaoValida ? 'bg-[#009B4D]' : 'bg-[#97a59d]'
                    }`}
                    aria-hidden="true"
                  />
                  {configuracaoValida ? 'Dados validados' : 'Não testada'}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#68756d]">
                {configuracaoValida
                  ? 'Parâmetros conferidos localmente e prontos para envio ao servidor.'
                  : 'A conexão ainda não foi testada com o servidor.'}
              </p>

              {/* Resumo do canal e destino */}
              <div className="mt-4 rounded-2xl border border-[#dce6e0] bg-gradient-to-br from-[#f7faf8] to-[#eef5f0] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-[#68756d]">
                      Canal ThingSpeak
                    </span>
                    <p className="mt-0.5 font-mono text-lg font-bold tracking-tight tabular-nums text-[#18251e]">
                      {canalId.trim() ? `#${canalId.trim()}` : 'Não informado'}
                    </p>
                  </div>

                  <span className="rounded-lg border border-[#d6e3db] bg-white px-2.5 py-1 text-xs font-semibold text-[#15693E]">
                    {ROTULOS_FREQUENCIA[frequencia] ?? `${frequencia}s`}
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-[#e1eae4] pt-3 text-xs">
                  <div>
                    <span className="text-[#68756d]">Destino</span>
                    <p className="mt-0.5 truncate font-semibold text-[#18251e]">
                      {propriedadeAtual && loteAtual
                        ? `${propriedadeAtual.nome} · ${loteAtual.identificacao}`
                        : propriedadeAtual
                          ? propriedadeAtual.nome
                          : 'Não selecionado'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[#68756d]">Profundidade</span>
                    <p className="mt-0.5 font-semibold tabular-nums text-[#18251e]">
                      {profundidade && Number(profundidade) > 0
                        ? `${profundidade} cm`
                        : 'Não definida'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco de payload */}
              <div className="mt-5 border-t border-[#edf2ee] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#76847c]">
                  Último payload recebido
                </p>

                <pre className="mt-3 overflow-x-auto rounded-2xl border border-[#e6ede9] bg-[#f8faf9] p-4 font-mono text-xs leading-5 text-[#33443a]">
                  {payloadPreview}
                </pre>
              </div>

              {/* Ação principal */}
              <div className="mt-6 border-t border-[#edf2ee] pt-5">
                <button
                  type="button"
                  onClick={validarConfiguracao}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#009B4D] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,155,77,.18)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
                >
                  Validar configuração
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function inputClass() {
  return 'min-h-12 w-full rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-4 text-sm text-[#26352d] outline-none transition placeholder:text-[#8a968f] focus:border-[#009B4D] focus:bg-white focus:ring-4 focus:ring-[#009B4D]/10'
}

function Field({
  label,
  required,
  error,
  htmlFor,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-[#2d3b33]"
      >
        {label}

        {required ? (
          <span className="ml-1 text-[#009B4D]" aria-hidden="true">
            *
          </span>
        ) : null}

        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}