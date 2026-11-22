import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Campo, IndicadorProdutor, campo } from './ProdutorUi'
import { formatarData, formatarNumero } from '@/lib/formatar'
import { mediaComparavel } from '@/lib/indicadoresProdutor'
import { LIMITE_COTACOES, PRODUTOS_MERCADO, nomeSerie, serieComparavel } from '@/lib/seriesMercado'
import { UFS } from '@/lib/ufs'
import { precoService } from '@/services/precoService'
import type { PrecoResposta, ProdutoMercado } from '@/types/api'

const PERIODO_DIAS = 30

export function VariacaoMercado({ ufPropriedade, revisao }: { ufPropriedade?: string; revisao: number }) {
  const [produto, setProduto] = useState<ProdutoMercado>('MANGA')
  const [uf, setUf] = useState(ufPropriedade ?? 'PE')
  const [serie, setSerie] = useState('')
  const [consulta, setConsulta] = useState<{ chave: string; dados: PrecoResposta | null }>()
  const chave = `${produto}-${uf}-${revisao}`

  useEffect(() => {
    let ativo = true
    void precoService.consultar(produto, uf, LIMITE_COTACOES)
      .then((dados) => { if (ativo) setConsulta({ chave, dados }) })
      .catch(() => { if (ativo) setConsulta({ chave, dados: null }) })
    return () => { ativo = false }
  }, [chave, produto, uf])

  const atual = consulta?.chave === chave ? consulta : null
  const dados = atual?.dados
  const series = dados ? serieComparavel(dados, PERIODO_DIAS) : []
  const grupo = series.find(({ chave }) => chave === serie) ?? series[0]
  const ultima = grupo?.registros.at(-1)
  const primeira = grupo?.registros[0]
  const variacao = ultima && grupo ? mediaComparavel(ultima.preco, grupo.registros.map((r) => r.preco)) : null
  const valor = variacao === null ? '—' : `${variacao >= 0 ? '+' : ''}${formatarNumero(variacao, 2)}%`

  const ajuda = !atual ? 'Consultando cotações…' : !dados ? 'Cotações temporariamente indisponíveis.'
    : ultima && primeira
      ? `${nomeSerie(ultima)} · ${formatarData(primeira.data)} a ${formatarData(ultima.data)} · ${grupo.registros.length} cotações${dados.desatualizado ? ' · dados em cache' : ''}`
      : `Sem cotações nos últimos ${PERIODO_DIAS} dias.`

  return <div className="space-y-2">
    <IndicadorProdutor nome="Variação de mercado" valor={valor} ajuda={ajuda} icone={TrendingUp} />
    <div className="grid grid-cols-2 gap-2 px-1">
      <Campo rotulo="Produto"><select className={campo} value={produto} onChange={(e) => { setProduto(e.target.value as ProdutoMercado); setSerie('') }}>
        {PRODUTOS_MERCADO.map(({ texto, valor }) => <option key={valor} value={valor}>{texto}</option>)}
      </select></Campo>
      <Campo rotulo="UF da cotação"><select className={campo} value={uf} onChange={(e) => { setUf(e.target.value); setSerie('') }}>
        {UFS.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
      </select></Campo>
      {series.length > 1 ? <div className="col-span-2"><Campo rotulo="Série"><select className={campo} value={grupo?.chave} onChange={(e) => setSerie(e.target.value)}>
        {series.map(({ chave, registros }) => <option key={chave} value={chave}>{nomeSerie(registros[registros.length - 1])}</option>)}
      </select></Campo></div> : null}
    </div>
    <p className="px-1 text-xs leading-5 text-[#526158]">
      Último preço em relação à média disponível da série nos últimos {PERIODO_DIAS} dias. A consulta solicita até {LIMITE_COTACOES} cotações.
      {ultima && variacao === null ? ' A série precisa de pelo menos duas cotações e média maior que zero.' : ''}
    </p>
  </div>
}
