import { Cpu, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppShell } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { useAuth } from '@/context/AuthContext'
import { formatarData } from '@/lib/formatar'
import { podeEscrever } from '@/lib/permissoes'
import { ApiError } from '@/services/api'
import { sensorService } from '@/services/sensorService'
import type { Sensor } from '@/types/api'

import { rotuloTipoSensor } from './tiposSensor'

export default function Sensores() {
  const { usuario } = useAuth()
  const podeEditar = podeEscrever(usuario?.perfil)

  const [sensores, setSensores] = useState<Sensor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroExclusao, setErroExclusao] = useState('')

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

    carregarSensores()

    return () => {
      ativo = false
    }
  }, [])

  async function excluirSensor(sensor: Sensor) {
    setErroExclusao('')

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o sensor "${sensor.codigo}"? Ele deixa de receber novas leituras.`,
    )
    if (!confirmar) return

    try {
      await sensorService.remover(sensor.id)
      setSensores((atuais) => atuais.filter((item) => item.id !== sensor.id))
    } catch (error) {
      setErroExclusao(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível excluir o sensor.',
      )
    }
  }

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">

        <section className="overflow-hidden rounded-[24px] border border-[#e1e7e3] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-[7px] border-[#d7d9d8] px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-semibold tracking-[-0.04em] text-[#18251e]">
                Sensores
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756d]">
                Cadastre e gerencie os sensores utilizados no monitoramento da produção.
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

        <section
          className="mt-5 rounded-[24px] border border-[#e1e7e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6"
          aria-labelledby="sensores-list-title"
        >

          <div className="border-b border-[#edf1ee] pb-5">
            <h2
              id="sensores-list-title"
              className="text-lg font-semibold tracking-[-0.02em] text-[#1c2922]"
            >
              Sensores cadastrados
            </h2>

            {!carregando && !erro ? (
              <p className="mt-1 text-sm text-[#718078]">
                {sensores.length}{' '}
                {sensores.length === 1 ? 'sensor cadastrado' : 'sensores cadastrados'}
              </p>
            ) : null}
          </div>

          {erroExclusao ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erroExclusao}</FeedbackMessage>
            </div>
          ) : null}

          {carregando ? (
            <p className="mt-5 text-sm text-[#68756d]" role="status">
              Carregando sensores...
            </p>
          ) : erro ? (
            <div className="mt-5">
              <FeedbackMessage variant="error">{erro}</FeedbackMessage>
            </div>
          ) : sensores.length === 0 ? (
            <p className="mt-5 text-sm text-[#68756d]">
              Nenhum sensor para mostrar. Quando você cadastrar um sensor em um
              lote de uma de suas propriedades, ele aparece aqui.
            </p>
          ) : (
            <div className="mt-5 space-y-3">

              {sensores.map((sensor) => (
                <article
                  key={sensor.id}
                  className="rounded-2xl border border-[#dfe6e1] bg-white p-4 transition hover:border-[#c7d7cd] hover:shadow-[0_12px_28px_rgba(31,41,51,.06)] sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-start gap-4">

                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#15693E]">
                        <Cpu size={21} aria-hidden="true" />
                      </span>

                      <div>
                        <h3 className="text-base font-semibold text-[#202d25] sm:text-lg">
                          {sensor.codigo}
                        </h3>

                        <p className="mt-1 text-sm text-[#66746c]">
                          Tipo: {rotuloTipoSensor(sensor.tipo)}
                        </p>

                        <p className="mt-1 text-sm text-[#66746c]">
                          Lote: {sensor.lote.identificacao}
                        </p>

                        {sensor.localizacao ? (
                          <p className="mt-1 text-sm text-[#66746c]">
                            Localização: {sensor.localizacao}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm text-[#66746c]">
                          Instalado em: {formatarData(sensor.dataInstalacao)}
                        </p>

                        <span className="mt-3 inline-flex rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-semibold text-[#15693E]">
                          Ativo
                        </span>
                      </div>

                    </div>

                    {podeEditar ? (
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                        <Link
                          to={`/sensores/${sensor.id}/editar`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D9A31A] bg-white px-4 text-sm font-semibold text-[#9A7000] transition hover:bg-[#FFF9E8]"
                        >
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirSensor(sensor)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#E57373] bg-white px-4 text-sm font-semibold text-[#C62828] transition hover:bg-[#FFF5F5] cursor-pointer"
                        >
                          Excluir
                        </button>

                      </div>
                    ) : null}

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

      </div>
    </AppShell>
  )
}
