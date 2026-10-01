export interface Cultura {
  id: number
  nome: string
  temperaturaMin: number
  temperaturaMax: number
  umidadeMin: number
  umidadeMax: number
}

export const culturas: Cultura[] = [
  {
    id: 1,
    nome: 'Uva Vitória',
    temperaturaMin: 18,
    temperaturaMax: 32,
    umidadeMin: 50,
    umidadeMax: 80,
  },
  {
    id: 2,
    nome: 'Manga Palmer',
    temperaturaMin: 18,
    temperaturaMax: 32,
    umidadeMin: 50,
    umidadeMax: 80,
  },
]