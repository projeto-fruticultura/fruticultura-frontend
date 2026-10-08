import type { CulturaPayload } from '@/types/api'

export interface CulturaFormValores {
  nome: string
  variedade: string
  descricao: string
  temperaturaMin: string
  temperaturaMax: string
  umidadeMin: string
  umidadeMax: string
}

export type CulturaErros = Partial<Record<keyof CulturaFormValores, string>>

export const CULTURA_VAZIA: CulturaFormValores = {
  nome: '',
  variedade: '',
  descricao: '',
  temperaturaMin: '',
  temperaturaMax: '',
  umidadeMin: '',
  umidadeMax: '',
}

// Texto -> numero, aceitando virgula. Campo vazio NAO vira 0: devolve um erro, para nada ser enviado sem querer.
function lerNumero(texto: string, rotulo: string, minimo: number, maximo: number): { numero?: number; erro?: string } {
  const limpo = texto.trim().replace(',', '.')
  if (!limpo) return { erro: `Informe ${rotulo}.` }
  if (!/^-?\d+(\.\d{1,2})?$/.test(limpo)) return { erro: 'Use um número com no máximo 2 casas decimais.' }
  const numero = Number(limpo)
  if (numero < minimo || numero > maximo) return { erro: `O valor deve estar entre ${minimo} e ${maximo}.` }
  return { numero }
}

// Mesmas regras do backend (nome de 2 a 100, variedade ate 100, descricao ate 1000, faixas e minimo <= maximo),
// para mostrar o erro no campo certo antes de enviar. O backend continua sendo quem decide de verdade.
export function validarCultura(valores: CulturaFormValores): { erros: CulturaErros; payload?: CulturaPayload } {
  const erros: CulturaErros = {}

  const nome = valores.nome.trim()
  if (nome.length < 2 || nome.length > 100) erros.nome = 'O nome deve ter entre 2 e 100 caracteres.'

  const variedade = valores.variedade.trim()
  if (variedade.length > 100) erros.variedade = 'A variedade deve ter no máximo 100 caracteres.'

  const descricao = valores.descricao.trim()
  if (descricao.length > 1000) erros.descricao = 'A descrição deve ter no máximo 1000 caracteres.'

  const tempMin = lerNumero(valores.temperaturaMin, 'a temperatura mínima', -50, 60)
  const tempMax = lerNumero(valores.temperaturaMax, 'a temperatura máxima', -50, 60)
  const umidMin = lerNumero(valores.umidadeMin, 'a umidade mínima', 0, 100)
  const umidMax = lerNumero(valores.umidadeMax, 'a umidade máxima', 0, 100)

  if (tempMin.erro) erros.temperaturaMin = tempMin.erro
  if (tempMax.erro) erros.temperaturaMax = tempMax.erro
  if (umidMin.erro) erros.umidadeMin = umidMin.erro
  if (umidMax.erro) erros.umidadeMax = umidMax.erro

  if (tempMin.numero !== undefined && tempMax.numero !== undefined && tempMin.numero > tempMax.numero) {
    erros.temperaturaMin = 'A temperatura mínima não pode ser maior que a máxima.'
  }
  if (umidMin.numero !== undefined && umidMax.numero !== undefined && umidMin.numero > umidMax.numero) {
    erros.umidadeMin = 'A umidade mínima não pode ser maior que a máxima.'
  }

  if (Object.keys(erros).length > 0) return { erros }

  return {
    erros,
    payload: {
      nome,
      variedade: variedade || null,
      descricao: descricao || null,
      temperaturaMin: tempMin.numero as number,
      temperaturaMax: tempMax.numero as number,
      umidadeMin: umidMin.numero as number,
      umidadeMax: umidMax.numero as number,
    },
  }
}
