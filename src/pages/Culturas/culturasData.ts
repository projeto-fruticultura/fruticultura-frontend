export interface Cultura {
  id: number
  nome: string
  temperaturaMinima: number
  temperaturaMaxima: number
  umidadeMinima: number
  umidadeMaxima: number
}

export const culturas: Cultura[] = [
  {
    id: 1,
    nome: 'Uva Vitória',
    temperaturaMinima: 18,
    temperaturaMaxima: 32,
    umidadeMinima: 50,
    umidadeMaxima: 80,
  },
  {
    id: 2,
    nome: 'Manga Palmer',
    temperaturaMinima: 18,
    temperaturaMaxima: 32,
    umidadeMinima: 50,
    umidadeMaxima: 80,
  },
]