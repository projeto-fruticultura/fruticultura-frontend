import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avaliarCadeiaFrio, condicaoPropriedade, leituraAntiga, mediaComparavel } from '../src/lib/indicadoresProdutor.ts'
import { decodificarLogistica, decodificarPaginaLogistica } from '../src/lib/decodificarLogistica.ts'
import { serieComparavel } from '../src/lib/seriesMercado.ts'

const agora = Date.parse('2026-11-18T16:00:00Z')
const propriedade = { id: 10, nome: 'Vale', totalLotes: 1 }
const lotes = [{ id: 12, propriedadeId: 10 }]
const sensores = [{ id: 20, loteId: 12, status: 'ATIVO' }]
const ler = (dataHoraLeitura, sensorId = 20) => ({ sensorId, dataHoraLeitura })
const transporte = { exigeCadeiaFrio: true, colhidoEm: '2026-11-18T10:00:00Z', resfriadoEm: '2026-11-18T15:59:00Z', temperaturaResfriamentoC: 7 }

 test('leituras antigas não são confundidas com dados recentes', () => {
  assert.equal(leituraAntiga('2026-11-18T14:58:00Z', agora), true)
  assert.equal(leituraAntiga('2026-11-18T15:30:00Z', agora), false)
  assert.equal(leituraAntiga(null, agora), true)
})

test('propriedade sem leitura não recebe status verde', () => {
  assert.equal(condicaoPropriedade(propriedade, lotes, sensores, [], [], agora), 'SEM_DADOS')
})

test('falha de API não é interpretada como ausência de alertas', () => {
  assert.equal(condicaoPropriedade(propriedade, lotes, sensores, null, [], agora), 'NAO_VERIFICADO')
})

test('sensor com leitura antiga impede indicação verde', () => {
  assert.equal(condicaoPropriedade(propriedade, lotes, sensores, [ler('2026-11-18T14:58:00Z')], [], agora), 'LEITURA_ANTIGA')
})

test('todos os sensores ativos precisam de leituras recentes', () => {
  const dois = [...sensores, {id: 21, loteId: 12, status: 'ATIVO'}]
  assert.equal(condicaoPropriedade(propriedade, lotes, dois, [ler('2026-11-18T15:30:00Z')], [], agora), 'NAO_VERIFICADO')
  assert.equal(condicaoPropriedade(propriedade, lotes, dois, [ler('2026-11-18T15:30:00Z'), ler('2026-11-18T15:50:00Z',21)], [], agora), 'SEM_ALERTAS')
})

test('alerta da própria propriedade prevalece', () => {
  assert.equal(condicaoPropriedade(propriedade, lotes, sensores, [ler('2026-11-18T15:30:00Z')], [{propriedadeId:10}], agora), 'ALERTA')
})

test('cadeia do frio: dentro da janela abaixo de 6h', () => {
  assert.equal(avaliarCadeiaFrio(transporte), 'CONFORME')
})

test('cadeia do frio: exatamente 6h não está conforme', () => {
  assert.equal(avaliarCadeiaFrio({...transporte, resfriadoEm: '2026-11-18T16:00:00Z'}), 'ATENCAO')
})

test('cadeia do frio: temperatura fora da faixa sinaliza atenção', () => {
  assert.equal(avaliarCadeiaFrio({...transporte, temperaturaResfriamentoC: 11}), 'ATENCAO')
})

test('cadeia do frio: medição ausente não é presumida', () => {
  assert.equal(avaliarCadeiaFrio({...transporte, temperaturaResfriamentoC: null}), 'PENDENTE')
})

test('média comparável precisa de histórico suficiente', () => {
  assert.equal(mediaComparavel(10, []), null)
  assert.equal(mediaComparavel(12, [10, 10]), 20)
})

test('API de logística requer itens válidos', () => {
  assert.throws(() => decodificarLogistica({dados: {id:1}}))
  assert.deepEqual(decodificarLogistica({ dados: [{ id: 1, origem:'Recife', destino:'Juazeiro', modal:'RODOVIARIO', situacao:'PLANEJADA' }] }).map((x) => x.id), [1])
})

test('logística não assume status quando API retorna código inválido', () => {
  assert.throws(() => decodificarLogistica([{ id: 1, origem:'Recife', destino:'Juazeiro', modal:'RODOVIARIO', situacao:'INDEFINIDO' }]))
})

test('mercado separa séries por CEASA, variedade, produto e unidade', () => {
  const base = { produto: 'MANGA', variedade: 'Palmer', uf: 'PE', unidade: 'kg', data: '2026-11-17', preco: 10 }
  const historico = [ { ...base, ceasa: 'Recife' }, { ...base, ceasa: 'Petrolina', preco: 20 }, { ...base, ceasa: 'Recife', unidade:'caixa', preco:100 } ]
  assert.equal(serieComparavel({precoAtual:null,historico}, 30, agora).length, 3)
})

test('mercado elimina mesma cotação duplicada sem inventar séries', () => {
  const cotacao = { produto: 'UVA', variedade: 'Italia', uf: 'PE', unidade: 'kg', ceasa: 'Recife', data: '2026-11-17', preco:10 }
  assert.equal(serieComparavel({precoAtual:cotacao,historico:[cotacao]},30,agora)[0].registros.length,1)
})

test('lê a página do backend e diferencia exigência desconhecida de dispensada', () => {
  const frete = { id: 1, origem: 'Petrolina', destino: 'Recife', modal: 'RODOVIARIO', situacao: 'PLANEJADA' }
  const paginacao = { pagina: 2, limite: 20, total: 22, totalPaginas: 2 }
  const pagina = decodificarPaginaLogistica({
    dados: [
      { ...frete, exigeRefrigeracaoRapida: null },
      { ...frete, id: 2, exigeRefrigeracaoRapida: false },
    ],
    paginacao,
  })
  assert.deepEqual(pagina.paginacao, paginacao)
  assert.deepEqual(pagina.dados.map(({ exigeCadeiaFrio }) => exigeCadeiaFrio), [null, false])
  assert.throws(() => decodificarPaginaLogistica({ dados: [], paginacao: { ...paginacao, pagina: -1 } }))
})

test('cadeia do frio inclui os limites de 0 °C e 10 °C quando a API retorna medições', () => {
  for (const temperatura of [0, 10]) {
    const [frete] = decodificarLogistica([{
      id: 1, origem: 'Petrolina', destino: 'Recife', modal: 'RODOVIARIO', situacao: 'PLANEJADA',
      exigeRefrigeracaoRapida: true,
      colhidoEm: transporte.colhidoEm,
      resfriadoEm: transporte.resfriadoEm,
      temperaturaResfriamentoC: temperatura,
    }])
    assert.equal(avaliarCadeiaFrio(frete), 'CONFORME')
  }
})
