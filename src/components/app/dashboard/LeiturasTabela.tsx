import React, { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarDataHora, formatarNumero } from '@/lib/formatar'
import type { Paginacao } from '@/types/api'

export interface LinhaLeitura {
  id: number
  propriedade: string
  lote: string
  sensor: string
  temperatura: number
  umidade: number
  dataHoraLeitura: string
  desatualizada: boolean
}

interface LeiturasTabelaProps {
  linhas: LinhaLeitura[]
  carregando: boolean
  erro: string
  vazio: string
  paginacao?: Paginacao
  onPagina?: (pagina: number) => void
}

export function LeiturasTabela({ linhas, carregando, erro, vazio, paginacao, onPagina }: LeiturasTabelaProps) {
  // Estado para alternar entre 'temperatura' e 'umidade'
  const [metricaAtiva, setMetricaAtiva] = useState<'temperatura' | 'umidade'>('temperatura')

  if (erro) return <FeedbackMessage variant="error">{erro}</FeedbackMessage>

  // Formata os dados para o Recharts ler corretamente
  const dadosFormatados = linhas.map((item) => ({
    ...item,
    horarioFormatado: formatarDataHora(item.dataHoraLeitura),
    valorMetrica: metricaAtiva === 'temperatura' ? item.temperatura : item.umidade,
  }))

  const corGrafico = metricaAtiva === 'temperatura' ? '#f97316' : '#0ea5e9' // Laranja para Temp, Azul para Umidade
  const unidadeMedida = metricaAtiva === 'temperatura' ? '°C' : '%'
  const tituloMetrica = metricaAtiva === 'temperatura' ? 'Temperatura' : 'Umidade Relativa'

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e6ece8] shadow-sm flex flex-col gap-5">
      {/* Cabeçalho do Componente com os Botões de Alternância (Toggle) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#2d3a33]">Evolução das Leituras Recentes</h3>
          <p className="text-xs text-[#7a8780]">Visualização gráfica dos dados coletados pelos sensores</p>
        </div>

        {/* Alternador de Métrica */}
        <div className="inline-flex rounded-xl border border-[#dbe5df] bg-[#f3f8f5] p-1">
          <button
            type="button"
            onClick={() => setMetricaAtiva('temperatura')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricaAtiva === 'temperatura'
                ? 'bg-white text-[#2d3a33] shadow-sm border border-[#e6ece8]'
                : 'text-[#5f6d65] hover:text-[#2d3a33]'
            }`}
          >
            Temperatura (°C)
          </button>
          <button
            type="button"
            onClick={() => setMetricaAtiva('umidade')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metricaAtiva === 'umidade'
                ? 'bg-white text-[#2d3a33] shadow-sm border border-[#e6ece8]'
                : 'text-[#5f6d65] hover:text-[#2d3a33]'
            }`}
          >
            Umidade (%)
          </button>
        </div>
      </div>

      {/* Corpo / Área do Gráfico ou Estados (Carregando / Vazio) */}
      <div className="h-80 w-full pt-2">
        {carregando ? (
          <div className="h-full flex items-center justify-center text-sm text-[#7a8780]" role="status">
            Carregando leituras...
          </div>
        ) : linhas.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#7a8780]">
            {vazio}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosFormatados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetrica" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corGrafico} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={corGrafico} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ee" />
              <XAxis dataKey="horarioFormatado" stroke="#7a8780" fontSize={11} tickLine={false} />
              <YAxis stroke="#7a8780" fontSize={11} tickLine={false} unit={unidadeMedida} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e6ece8',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any) => [
                  `${formatarNumero(value ?? 0)} ${unidadeMedida}`,
                  tituloMetrica,
                ]}
                labelStyle={{ fontWeight: 'bold', color: '#2d3a33', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="valorMetrica"
                stroke={corGrafico}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMetrica)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Paginação (Mantida exatamente como na tabela para não quebrar a lógica de navegação) */}
      {paginacao && onPagina && paginacao.totalPaginas > 1 ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#5f6d65] border-t border-[#edf1ee] pt-3">
          <span>
            Página {paginacao.pagina} de {paginacao.totalPaginas} · {paginacao.total} leituras
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPagina(paginacao.pagina - 1)}
              disabled={carregando || paginacao.pagina <= 1}
              className="rounded-lg border border-[#dbe5df] bg-white px-3 py-1.5 font-semibold transition hover:bg-[#f3f8f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onPagina(paginacao.pagina + 1)}
              disabled={carregando || paginacao.pagina >= paginacao.totalPaginas}
              className="rounded-lg border border-[#dbe5df] bg-white px-3 py-1.5 font-semibold transition hover:bg-[#f3f8f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}