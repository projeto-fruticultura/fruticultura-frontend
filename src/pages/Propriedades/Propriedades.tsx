import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Building2, Edit3, Home, LogOut, MapPin, Plus, RefreshCw, Sprout, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { propriedadeService } from '@/services/propriedadeService'
import type { PropriedadePayload, PropriedadeResumo } from '@/types/api'

const FORM_INICIAL = {
  nome: '',
  area: '',
  cidade: '',
  uf: 'PE',
  latitude: '',
  longitude: '',
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function Propriedades() {
  const { usuario, sair } = useAuth()
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [errosForm, setErrosForm] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setPropriedades(await propriedadeService.listar())
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar as propriedades.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  useEffect(() => {
    if (!modalAberto) return

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !salvando) setModalAberto(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalAberto, salvando])

  const totalSensores = useMemo(() => propriedades.reduce((soma, item) => soma + item.totalSensores, 0), [propriedades])
  const totalLotes = useMemo(() => propriedades.reduce((soma, item) => soma + item.totalLotes, 0), [propriedades])

  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_INICIAL)
    setErrosForm({})
    setErro('')
    setModalAberto(true)
  }

  async function abrirEdicao(id: number) {
    setErro('')
    try {
      const item = await propriedadeService.buscarPorId(id)
      setEditandoId(id)
      setForm({
        nome: item.nome,
        area: String(item.area),
        cidade: item.cidade,
        uf: item.uf,
        latitude: String(item.latitude),
        longitude: String(item.longitude),
      })
      setErrosForm({})
      setModalAberto(true)
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível abrir a propriedade.')
    }
  }

  function validarFormulario() {
    const novos: Record<string, string> = {}
    if (form.nome.trim().length < 3) novos.nome = 'Informe um nome com pelo menos 3 caracteres.'
    if (!form.cidade.trim()) novos.cidade = 'Informe a cidade.'
    if (!UFS.includes(form.uf)) novos.uf = 'Selecione uma UF válida.'

    const area = Number(form.area)
    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    if (!Number.isFinite(area) || area <= 0) novos.area = 'Informe uma área maior que zero.'
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) novos.latitude = 'Latitude deve estar entre -90 e 90.'
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) novos.longitude = 'Longitude deve estar entre -180 e 180.'

    setErrosForm(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(event: FormEvent) {
    event.preventDefault()
    setSucesso('')
    setErro('')
    if (!validarFormulario()) return

    const payload: PropriedadePayload = {
      nome: form.nome.trim(),
      area: Number(form.area),
      cidade: form.cidade.trim(),
      uf: form.uf,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    }

    setSalvando(true)
    try {
      if (editandoId) {
        await propriedadeService.atualizar(editandoId, payload)
        setSucesso('Propriedade atualizada com sucesso.')
      } else {
        await propriedadeService.criar(payload)
        setSucesso('Propriedade cadastrada com sucesso.')
      }
      setModalAberto(false)
      await carregar()
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message)
        if (error.campos) setErrosForm(error.campos)
      } else {
        setErro('Não foi possível salvar a propriedade.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function remover(item: PropriedadeResumo) {
    if (!window.confirm(`Excluir a propriedade “${item.nome}”? Esta ação fará uma exclusão lógica.`)) return

    setExcluindoId(item.id)
    setErro('')
    setSucesso('')
    try {
      await propriedadeService.remover(item.id)
      setSucesso('Propriedade removida com sucesso.')
      await carregar()
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível remover a propriedade.')
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f8f5] text-[#1F2933]">
      <header className="sticky top-0 z-30 border-b border-[#e1e9e4] bg-white/94 backdrop-blur-md">
        <div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] focus-visible:ring-offset-4"
              aria-label="Ir para a página inicial"
            >
              <img src="/assets/valesafra-logo.png" alt="ValeSafra" className="h-auto w-[160px] sm:w-[175px]" />
            </Link>
            <div className="hidden h-7 w-px bg-[#e3eae5] lg:block" aria-hidden="true" />
            <span className="hidden text-sm font-medium text-[#61706a] lg:inline">Gestão de propriedades</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-[#25313a]">{usuario?.nome}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-[#748078]">{usuario?.perfil}</p>
            </div>
            <button
              onClick={() => void sair()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d9e3dc] bg-white px-3 text-sm font-semibold text-[#47544d] transition hover:bg-[#f2f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#009B4D]">Gestão agrícola</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-[#16232c]">Propriedades</h1>
            <p className="mt-3 text-[15px] leading-7 text-[#637069]">Cadastre, consulte, atualize e remova propriedades vinculadas à sua operação.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void carregar()}
              disabled={carregando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d6e1da] bg-white px-4 text-sm font-semibold text-[#45534b] transition hover:bg-[#f7faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={carregando ? 'animate-spin' : ''} aria-hidden="true" /> Atualizar
            </button>
            <button
              onClick={abrirNovo}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,155,77,0.16)] transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
            >
              <Plus size={18} aria-hidden="true" /> Nova propriedade
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Resumo das propriedades">
          <ResumoCard icon={<Building2 size={21} aria-hidden="true" />} label="Propriedades ativas" value={propriedades.length} />
          <ResumoCard icon={<Sprout size={21} aria-hidden="true" />} label="Lotes cadastrados" value={totalLotes} />
          <ResumoCard icon={<MapPin size={21} aria-hidden="true" />} label="Sensores ativos" value={totalSensores} />
        </section>

        <div className="mt-6 space-y-3">
          {sucesso ? <FeedbackMessage variant="success">{sucesso}</FeedbackMessage> : null}
          {erro ? <FeedbackMessage variant="error">{erro}</FeedbackMessage> : null}
        </div>

        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#dfe8e2] bg-white shadow-[0_12px_35px_rgba(31,41,51,0.05)]" aria-labelledby="lista-propriedades-title">
          <div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-4 sm:px-6">
            <div>
              <h2 id="lista-propriedades-title" className="font-semibold text-[#24313a]">Propriedades cadastradas</h2>
              <p className="mt-1 text-xs text-[#748078]">{propriedades.length} {propriedades.length === 1 ? 'registro ativo' : 'registros ativos'}</p>
            </div>
          </div>

          {carregando ? (
            <div className="flex min-h-72 items-center justify-center px-6">
              <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-sm font-medium text-[#647168]">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#009B4D]/20 border-t-[#009B4D]" aria-hidden="true" />
                Carregando propriedades...
              </div>
            </div>
          ) : propriedades.length === 0 ? (
            <div className="px-6 py-16 text-center sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f0] text-[#15693E]">
                <Home size={25} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#26343d]">Nenhuma propriedade ativa</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6a756f]">Cadastre sua primeira propriedade para começar a organizar a operação no ValeSafra.</p>
              <button
                onClick={abrirNovo}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#009B4D] px-5 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20"
              >
                <Plus size={18} aria-hidden="true" /> Cadastrar propriedade
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <caption className="sr-only">Lista das propriedades cadastradas e ações disponíveis</caption>
                  <thead className="bg-[#f8faf9] text-xs uppercase tracking-[0.08em] text-[#6d7972]">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold">Propriedade</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Localização</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Lotes</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Sensores</th>
                      <th scope="col" className="px-6 py-4 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2ee]">
                    {propriedades.map((item) => (
                      <tr key={item.id} className="transition hover:bg-[#fbfdfc]">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#26343d]">{item.nome}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#5f6c65]">{item.cidade} - {item.uf}</td>
                        <td className="px-6 py-4 text-sm font-medium text-[#334139]">{item.totalLotes}</td>
                        <td className="px-6 py-4 text-sm font-medium text-[#334139]">{item.totalSensores}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => void abrirEdicao(item.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e3dc] text-[#15693E] transition hover:bg-[#eef7f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                              aria-label={`Editar ${item.nome}`}
                            >
                              <Edit3 size={17} aria-hidden="true" />
                            </button>
                            <button
                              disabled={excluindoId === item.id}
                              onClick={() => void remover(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Excluir ${item.nome}`}
                            >
                              <Trash2 size={17} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#edf2ee] md:hidden">
                {propriedades.map((item) => (
                  <article key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-[#26343d]">{item.nome}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-[#657169]">
                          <MapPin size={15} aria-hidden="true" /> {item.cidade} - {item.uf}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => void abrirEdicao(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e3dc] text-[#15693E] transition hover:bg-[#eef7f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D]"
                          aria-label={`Editar ${item.nome}`}
                        >
                          <Edit3 size={17} aria-hidden="true" />
                        </button>
                        <button
                          disabled={excluindoId === item.id}
                          onClick={() => void remover(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Excluir ${item.nome}`}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#f7faf8] p-4 text-sm">
                      <div>
                        <dt className="text-xs text-[#7a857e]">Lotes</dt>
                        <dd className="mt-1 font-semibold text-[#334139]">{item.totalLotes}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#7a857e]">Sensores</dt>
                        <dd className="mt-1 font-semibold text-[#334139]">{item.totalSensores}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {modalAberto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1c16]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="propriedade-dialog-title"
            className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e8eee9] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#009B4D]">{editandoId ? 'Atualização' : 'Cadastro'}</p>
                <h2 id="propriedade-dialog-title" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#24313a]">
                  {editandoId ? 'Editar propriedade' : 'Nova propriedade'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#6b766f]">Preencha os campos obrigatórios para salvar o registro.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#5d6962] transition hover:bg-[#f2f6f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:opacity-50"
                aria-label="Fechar formulário"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={salvar} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7" noValidate>
              <Campo id="propriedade-nome" label="Nome" erro={errosForm.nome} className="sm:col-span-2" required>
                <input
                  id="propriedade-nome"
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.nome)}
                  aria-describedby={errosForm.nome ? 'propriedade-nome-error' : undefined}
                  required
                />
              </Campo>

              <Campo id="propriedade-area" label="Área (ha)" erro={errosForm.area} required>
                <input
                  id="propriedade-area"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={form.area}
                  onChange={(event) => setForm({ ...form, area: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.area)}
                  aria-describedby={errosForm.area ? 'propriedade-area-error' : undefined}
                  required
                />
              </Campo>

              <Campo id="propriedade-cidade" label="Cidade" erro={errosForm.cidade} required>
                <input
                  id="propriedade-cidade"
                  value={form.cidade}
                  onChange={(event) => setForm({ ...form, cidade: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.cidade)}
                  aria-describedby={errosForm.cidade ? 'propriedade-cidade-error' : undefined}
                  required
                />
              </Campo>

              <Campo id="propriedade-uf" label="UF" erro={errosForm.uf} required>
                <select
                  id="propriedade-uf"
                  value={form.uf}
                  onChange={(event) => setForm({ ...form, uf: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.uf)}
                  aria-describedby={errosForm.uf ? 'propriedade-uf-error' : undefined}
                  required
                >
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Campo>

              <Campo id="propriedade-latitude" label="Latitude" erro={errosForm.latitude} required>
                <input
                  id="propriedade-latitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  onChange={(event) => setForm({ ...form, latitude: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.latitude)}
                  aria-describedby={errosForm.latitude ? 'propriedade-latitude-error' : undefined}
                  required
                />
              </Campo>

              <Campo id="propriedade-longitude" label="Longitude" erro={errosForm.longitude} required>
                <input
                  id="propriedade-longitude"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  onChange={(event) => setForm({ ...form, longitude: event.target.value })}
                  className="input-propriedade"
                  aria-invalid={Boolean(errosForm.longitude)}
                  aria-describedby={errosForm.longitude ? 'propriedade-longitude-error' : undefined}
                  required
                />
              </Campo>

              <div className="mt-1 flex flex-col-reverse gap-2 border-t border-[#edf2ee] pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="min-h-11 rounded-xl border border-[#d8e1db] bg-white px-5 text-sm font-semibold text-[#4b5851] transition hover:bg-[#f7faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009B4D] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="min-h-11 rounded-xl bg-[#009B4D] px-6 text-sm font-semibold text-white transition hover:bg-[#008844] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009B4D]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar propriedade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ResumoCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-[22px] border border-[#dfe8e2] bg-white p-5 shadow-[0_8px_24px_rgba(31,41,51,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#6a766f]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#163f2b]">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7f0] text-[#15693E]">
          {icon}
        </div>
      </div>
    </article>
  )
}

function Campo({ id, label, erro, className = '', required = false, children }: {
  id: string
  label: string
  erro?: string
  className?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#2d3932]">
        {label}
        {required ? <span className="ml-1 text-[#b42318]" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {erro ? <p id={`${id}-error`} className="mt-1.5 text-xs font-medium leading-5 text-red-700">{erro}</p> : null}
    </div>
  )
}
