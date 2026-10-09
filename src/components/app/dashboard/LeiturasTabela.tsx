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
  if (erro) return <FeedbackMessage variant="error">{erro}</FeedbackMessage>

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#e6ece8]">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead className="bg-[#eef1ef] text-[#435249]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Propriedade</th>
              <th className="px-3 py-2.5 font-semibold">Lote</th>
              <th className="px-3 py-2.5 font-semibold">Sensor</th>
              <th className="px-3 py-2.5 font-semibold">Temperatura</th>
              <th className="px-3 py-2.5 font-semibold">Umidade</th>
              <th className="px-3 py-2.5 font-semibold">Leitura</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="h-28 px-4 py-6 text-center text-sm text-[#7a8780]" role="status">
                  Carregando leituras...
                </td>
              </tr>
            ) : linhas.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-28 px-4 py-6 text-center text-sm text-[#7a8780]">
                  {vazio}
                </td>
              </tr>
            ) : (
              linhas.map((linha) => (
                <tr key={linha.id} className="border-t border-[#edf1ee] text-[#2d3a33]">
                  <td className="px-3 py-2.5">{linha.propriedade}</td>
                  <td className="px-3 py-2.5">{linha.lote}</td>
                  <td className="px-3 py-2.5">{linha.sensor}</td>
                  <td className="px-3 py-2.5">{formatarNumero(linha.temperatura)} °C</td>
                  <td className="px-3 py-2.5">{formatarNumero(linha.umidade)}%</td>
                  <td className="px-3 py-2.5">
                    {formatarDataHora(linha.dataHoraLeitura)}
                    {linha.desatualizada ? (
                      <span className="ml-2 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[10px] font-semibold text-[#8a5a00]">
                        leitura com mais de 60 min
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginacao && onPagina && paginacao.totalPaginas > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#5f6d65]">
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
