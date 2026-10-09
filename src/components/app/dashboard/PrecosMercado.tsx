import { Store } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FeedbackMessage } from '@/components/ui/FeedbackMessage'
import { formatarData, formatarDataHora, formatarMoeda } from '@/lib/formatar'
import { UFS } from '@/lib/ufs'
import { ApiError } from '@/services/api'
import { precoService } from '@/services/precoService'
import type { PrecoResposta, ProdutoMercado } from '@/types/api'

// So estes cinco produtos existem na CONAB do backend: nao e possivel escolher outro.
const PRODUTOS: { value: ProdutoMercado; label: string }[] = [
  { value: 'UVA', label: 'Uva' },
  { value: 'MANGA', label: 'Manga' },
  { value: 'BANANA', label: 'Banana' },
  { value: 'GOIABA', label: 'Goiaba' },
  { value: 'MELAO', label: 'Melão' },
]

type Estado =
  | { status: 'carregando' }
  | { status: 'sem-cotacao'; motivo: string }
  | { status: 'erro'; mensagem: string }
  | { status: 'ok'; dados: PrecoResposta }

export function PrecosMercado() {
  const [produto, setProduto] = useState<ProdutoMercado>('UVA')
  const [uf, setUf] = useState('PE')
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  // Ignora respostas antigas quando a pessoa troca o produto ou a UF rapidamente.
  const pedidoAtual = useRef(0)

  async function buscar(novoProduto: ProdutoMercado, novaUf: string) {
    const numero = ++pedidoAtual.current

    try {
      const dados = await precoService.consultar(novoProduto, novaUf)
      if (numero !== pedidoAtual.current) return
      setEstado({ status: 'ok', dados })
    } catch (error) {
      if (numero !== pedidoAtual.current) return
      if (error instanceof ApiError && error.status === 503) {
        setEstado({ status: 'sem-cotacao', motivo: 'A fonte de preços (CONAB) está indisponível agora.' })
      } else {
        setEstado({
          status: 'erro',
          mensagem: error instanceof ApiError ? error.message : 'Não foi possível consultar os preços.',
        })
      }
    }
  }

  // Troca de produto ou UF: mostra "Consultando..." e busca. A primeira busca (abaixo) ja parte do estado "carregando".
  function consultar(novoProduto: ProdutoMercado, novaUf: string) {
    setEstado({ status: 'carregando' })
    void buscar(novoProduto, novaUf)
  }

  useEffect(() => {
    void buscar('UVA', 'PE')
  }, [])

  function mudarProduto(valor: string) {
    const novo = valor as ProdutoMercado
    setProduto(novo)
    consultar(novo, uf)
  }

  function mudarUf(valor: string) {
    setUf(valor)
    consultar(produto, valor)
  }

  return (
    <section className="mt-4 rounded-[22px] border border-[#e0e7e2] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="precos-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="precos-title" className="text-base font-semibold text-[#1d2b23]">Preços de mercado</h2>
          <p className="mt-1 text-xs text-[#7a8780]">Preço diário de atacado nas CEASAs, da CONAB (por kg)</p>
        </div>
        <Store size={18} className="text-[#168150]" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <label htmlFor="preco-produto" className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#526158]">Produto</span>
          <select
            id="preco-produto"
            value={produto}
            onChange={(event) => mudarProduto(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-[#dce4df] bg-[#f6f8f7] px-3 text-sm text-[#35453c] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
          >
            {PRODUTOS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label htmlFor="preco-uf" className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#526158]">Estado (UF)</span>
          <select
            id="preco-uf"
            value={uf}
            onChange={(event) => mudarUf(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-[#dce4df] bg-[#f6f8f7] px-3 text-sm text-[#35453c] outline-none transition focus:border-[#009B4D] focus:ring-4 focus:ring-[#009B4D]/10"
          >
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        {estado.status === 'carregando' ? (
          <p className="text-sm text-[#6f7c74]" role="status">Consultando preços...</p>
        ) : estado.status === 'sem-cotacao' ? (
          <div className="rounded-xl border border-[#e6ece8] px-4 py-6 text-center">
            <p className="text-sm font-semibold text-[#2d3a33]">Sem cotação no momento</p>
            <p className="mt-1 text-xs text-[#7a8780]">{estado.motivo}</p>
          </div>
        ) : estado.status === 'erro' ? (
          <FeedbackMessage variant="error">{estado.mensagem}</FeedbackMessage>
        ) : (
          <PrecosResultado dados={estado.dados} />
        )}
      </div>
    </section>
  )
}

function PrecosResultado({ dados }: { dados: PrecoResposta }) {
  const atual = dados.precoAtual

  return (
    <div>
      {dados.desatualizado ? (
        <div className="mb-3">
          <FeedbackMessage variant="info">
            Dados desatualizados: a CONAB não respondeu agora e estes são os últimos preços guardados.
          </FeedbackMessage>
        </div>
      ) : null}

      {atual ? (
        <div className="rounded-xl border border-[#e6ece8] bg-[#fbfdfb] px-4 py-4">
          <p className="text-xs font-semibold text-[#5f6d65]">Preço mais recente</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1b2821]">
            {formatarMoeda(atual.preco)} <span className="text-sm font-medium text-[#7a8780]">por {atual.unidade.toLowerCase()}</span>
          </p>
          <p className="mt-1 text-xs text-[#6f7c74]">
            {atual.produto}
            {atual.variedade ? ` ${atual.variedade}` : ''} · {atual.ceasa} · {formatarData(atual.data)}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e6ece8] px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[#2d3a33]">Sem cotação no momento</p>
          <p className="mt-1 text-xs text-[#7a8780]">Não há registros recentes para este produto neste estado.</p>
        </div>
      )}

      {dados.historico.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#e6ece8]">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead className="bg-[#eef1ef] text-[#435249]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Data</th>
                <th className="px-3 py-2.5 font-semibold">CEASA</th>
                <th className="px-3 py-2.5 font-semibold">Variedade</th>
                <th className="px-3 py-2.5 font-semibold">Preço</th>
              </tr>
            </thead>
            <tbody>
              {dados.historico.map((registro, indice) => (
                <tr key={`${registro.data}-${registro.ceasa}-${indice}`} className="border-t border-[#edf1ee] text-[#2d3a33]">
                  <td className="px-3 py-2.5">{formatarData(registro.data)}</td>
                  <td className="px-3 py-2.5">{registro.ceasa}</td>
                  <td className="px-3 py-2.5">{registro.variedade ?? '—'}</td>
                  <td className="px-3 py-2.5">{formatarMoeda(registro.preco)}/{registro.unidade.toLowerCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-4 text-[#8a958f]">
        Fonte: {dados.fonte} · dados baixados em {formatarDataHora(dados.consultadoEn)}
      </p>
    </div>
  )
}
