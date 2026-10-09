// Situacoes de lote oferecidas no formulario. O backend aceita texto livre de ate 30 caracteres;
// esta lista so padroniza o que o front envia.
export const SITUACOES_LOTE = [
  { value: 'EM_PREPARACAO', label: 'Em preparação' },
  { value: 'PLANTADO', label: 'Plantado' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'EM_COLHEITA', label: 'Em colheita' },
  { value: 'EM_DESCANSO', label: 'Em descanso' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

// Valor fora da lista (ex.: EM_CRESCIMENTO, de lotes antigos) aparece legivel: "Em crescimento".
export function rotuloSituacao(valor: string) {
  const conhecida = SITUACOES_LOTE.find((situacao) => situacao.value === valor)
  if (conhecida) return conhecida.label
  const texto = valor.replace(/_/g, ' ').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
