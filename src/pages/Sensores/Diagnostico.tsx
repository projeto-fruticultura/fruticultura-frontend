
import {
  AlertTriangle,
  Clock3,
  Sprout,
  Cpu,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { alertaService } from '@/services/alertaService'
import { propriedadeService } from '@/services/propriedadeService'
import { loteService } from '@/services/loteService'
import { ApiError } from '@/services/api'

import { formatarData } from '@/lib/formatar'

import type {
  Alerta,
  PropriedadeResumo,
  Lote,
} from '@/types/api'

export default function Diagnostico() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])

  const [propriedadeSelecionada, setPropriedadeSelecionada] = useState('')
  const [loteSelecionado, setLoteSelecionado] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro('')

        const [dadosAlertas, dadosPropriedades, dadosLotes] =
          await Promise.all([
            alertaService.listar(),
            propriedadeService.listar(),
            loteService.listar(),
          ])

        setAlertas(dadosAlertas.alertas)
        setPropriedades(dadosPropriedades)
        setLotes(dadosLotes)
      } catch (error) {
        setErro(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os dados do diagnóstico.',
        )
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const alertasFiltrados = alertas.filter((alerta) => {
    const correspondePropriedade =
      !propriedadeSelecionada ||
      String(alerta.propriedadeId) === propriedadeSelecionada

    const correspondeLote =
      !loteSelecionado ||
      String(alerta.loteId) === loteSelecionado

    return correspondePropriedade && correspondeLote
  })

  function obterDescricaoAlerta(tipo: Alerta['tipo']) {
    const descricoes = {
      TEMPERATURA_ALTA: 'Temperatura acima do limite',
      TEMPERATURA_BAIXA: 'Temperatura abaixo do limite',
      UMIDADE_ALTA: 'Umidade acima do limite',
      UMIDADE_BAIXA: 'Umidade abaixo do limite',
    }

    return descricoes[tipo]
  }

  const totalSensores = propriedades.reduce(
    (total, propriedade) => total + propriedade.totalSensores,
    0,
  )

  const totalAlertas = alertasFiltrados.length

  const leiturasDesatualizadas = alertasFiltrados.filter(
    (alerta) => alerta.leituraDesatualizada,
  ).length

  const totalPropriedades = propriedades.length

  return (
    <AppShell section="sensores">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <h1 className="text-3xl font-semibold text-[#18251e]">
          Central de Diagnóstico
        </h1>

        <p className="mt-2 text-sm text-[#68756d]">
          Acompanhe os alertas e as condições dos sensores das propriedades assistidas.
        </p>

        {/* INDICADORES */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#68756d]">
                Sensores cadastrados
              </span>
              <Cpu className="text-[#16834b]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#18251e]">
              {totalSensores}
            </p>
            <p className="mt-1 text-xs text-[#87928b]">
              Sensores nas propriedades
            </p>
          </article>

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#68756d]">
                Alertas identificados
              </span>
              <AlertTriangle className="text-[#d97706]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#18251e]">
              {totalAlertas}
            </p>
            <p className="mt-1 text-xs text-[#87928b]">
              Alertas encontrados nos filtros
            </p>
          </article>

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#68756d]">
                Leituras desatualizadas
              </span>
              <Clock3 className="text-[#dc6b35]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#18251e]">
              {leiturasDesatualizadas}
            </p>
            <p className="mt-1 text-xs text-[#87928b]">
              Alertas com leitura desatualizada
            </p>
          </article>

          <article className="rounded-2xl border border-[#e1e7e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#68756d]">
                Propriedades monitoradas
              </span>
              <Sprout className="text-[#16834b]" size={22} />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#18251e]">
              {totalPropriedades}
            </p>
            <p className="mt-1 text-xs text-[#87928b]">
              Propriedades disponíveis
            </p>
          </article>

        </div>

        {/* FILTROS */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* FILTRO DE PROPRIEDADE */}
          <div>
            <label
              htmlFor="filtro-propriedade"
              className="mb-2 block text-sm font-medium text-[#34443a]"
            >
              Propriedade
            </label>

            <select
              id="filtro-propriedade"
              value={propriedadeSelecionada}
              onChange={(e) => {
                setPropriedadeSelecionada(e.target.value)
                setLoteSelecionado('')
              }}
              className="w-full rounded-xl border border-[#dfe6e1] bg-white p-3 text-sm"
            >
              <option value="">Todas as propriedades</option>
              {propriedades.map((propriedade) => (
                <option key={propriedade.id} value={propriedade.id}>
                  {propriedade.nome}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO DE LOTE */}
          <div>
            <label
              htmlFor="filtro-lote"
              className="mb-2 block text-sm font-medium text-[#34443a]"
            >
              Lote
            </label>

            <select
              id="filtro-lote"
              value={loteSelecionado}
              onChange={(e) => setLoteSelecionado(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e1] bg-white p-3 text-sm"
            >
              <option value="">Todos os lotes</option>
              {lotes
                .filter(
                  (lote) =>
                    !propriedadeSelecionada ||
                    String(lote.propriedadeId) === propriedadeSelecionada,
                )
                .map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.identificacao}
                  </option>
                ))}
            </select>
          </div>

        </div>

        {/* LISTA DE ALERTAS */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Alertas fitossanitários
            </h2>
          </div>

          {!carregando && !erro && alertasFiltrados.length === 0 && (
            <div className="rounded-lg bg-green-50 p-5 text-center">
              <p className="font-medium text-green-800">
                Nenhum alerta encontrado
              </p>
              <p className="mt-1 text-sm text-green-700">
                Não há alertas para os filtros selecionados.
              </p>
            </div>
          )}

          {!carregando && !erro && alertasFiltrados.length > 0 && (
            <div className="space-y-4">
              {alertasFiltrados.map((alerta, index) => (
                <div
                  key={`${alerta.sensorId}-${alerta.dataHoraLeitura}-${index}`}
                  className="rounded-lg border border-orange-200 bg-orange-50/50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {obterDescricaoAlerta(alerta.tipo)}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Sensor: {alerta.sensorCodigo}
                      </p>

                      <p className="text-sm text-gray-600">
                        Lote: {alerta.loteIdentificacao}
                      </p>

                      <p className="text-sm text-gray-600">
                        Cultura: {alerta.culturaNome}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                      Atenção
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-orange-200 pt-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        Valor identificado
                      </p>
                      <p className="font-semibold text-gray-900">
                        {alerta.valor}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Limite configurado
                      </p>
                      <p className="font-semibold text-gray-900">
                        {alerta.limite}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Data da leitura
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatarData(alerta.dataHoraLeitura)}
                      </p>
                    </div>
                  </div>

                  {alerta.leituraDesatualizada && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700">
                      <Clock3 className="h-4 w-4" />
                      Leitura desatualizada
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ESTADOS DE CARREGAMENTO E ERRO */}
        {carregando && (
          <p className="mt-6 text-sm text-[#68756d]" role="status">
            Carregando dados do diagnóstico...
          </p>
        )}

        {erro && (
          <div className="mt-6">
            <FeedbackMessage variant="error">{erro}</FeedbackMessage>
          </div>
        )}

        {!carregando && !erro && (
          <div className="mt-6">
            <p className="text-sm text-[#68756d]">
              Dados carregados: {alertasFiltrados.length} alertas encontrados.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
