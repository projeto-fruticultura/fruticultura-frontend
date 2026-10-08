import { AlertTriangle } from 'lucide-react'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarDataHora, formatarNumero } from '@/lib/formatar'
import type { Alerta, TipoAlerta } from '@/types/api'

export type EstadoAlertas =
  | { status: 'carregando' }
  | { status: 'indisponivel' }
  | { status: 'erro'; mensagem: string }
  | { status: 'ok'; total: number; alertas: Alerta[] }

const ROTULOS: Record<TipoAlerta, { texto: string; unidade: string }> = {
  TEMPERATURA_ALTA: { texto: 'Temperatura alta', unidade: '°C' },
  TEMPERATURA_BAIXA: { texto: 'Temperatura baixa', unidade: '°C' },
  UMIDADE_ALTA: { texto: 'Umidade alta', unidade: '%' },
  UMIDADE_BAIXA: { texto: 'Umidade baixa', unidade: '%' },
}

export function AlertasPainel({ estado }: { estado: EstadoAlertas }) {
  return (
    <section className="rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="alertas-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="alertas-title" className="text-base font-semibold text-[#1d2b23]">Alertas climáticos</h2>
          <p className="mt-1 text-xs text-[#7a8780]">Última leitura de cada sensor comparada com a faixa da cultura do lote</p>
        </div>
        <AlertTriangle size={18} className="text-[#f2a23d]" aria-hidden="true" />
      </div>

      <div className="mt-4">
        {estado.status === 'carregando' ? (
          <p className="text-sm text-[#6f7c74]" role="status">Carregando alertas...</p>
        ) : estado.status === 'indisponivel' ? (
          <FeedbackMessage variant="info">Alertas indisponíveis neste servidor no momento.</FeedbackMessage>
        ) : estado.status === 'erro' ? (
          <FeedbackMessage variant="error">{estado.mensagem}</FeedbackMessage>
        ) : estado.alertas.length === 0 ? (
          <p className="rounded-xl border border-[#e6ece8] px-4 py-6 text-center text-sm text-[#6f7c74]">
            Nenhum alerta no momento: as últimas leituras estão dentro da faixa de cada cultura.
          </p>
        ) : (
          <ul className="divide-y divide-[#edf1ee] overflow-hidden rounded-xl border border-[#e6ece8]">
            {estado.alertas.map((alerta, indice) => {
              const rotulo = ROTULOS[alerta.tipo]
              return (
                <li key={`${alerta.sensorId}-${alerta.tipo}-${indice}`} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-[#9a5b00]">{rotulo?.texto ?? alerta.tipo}</span>
                    <span className="text-[#2d3a33]">
                      {formatarNumero(alerta.valor)} {rotulo?.unidade}{' '}
                      <span className="text-[#7a8780]">(limite {formatarNumero(alerta.limite)} {rotulo?.unidade})</span>
                    </span>
                    {alerta.leituraDesatualizada ? (
                      <span className="rounded-full bg-[#FFF3D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a5a00]">
                        leitura com mais de 60 min
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[#7a8780]">
                    {alerta.loteIdentificacao} · sensor {alerta.sensorCodigo} · {alerta.culturaNome} · {formatarDataHora(alerta.dataHoraLeitura)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
