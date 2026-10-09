// Tipos de sensor oferecidos no formulario. O backend aceita texto de ate 45 caracteres.
export const TIPOS_SENSOR = [
  { value: 'TEMPERATURA', label: 'Temperatura' },
  { value: 'UMIDADE', label: 'Umidade' },
  { value: 'TEMPERATURA_UMIDADE', label: 'Temperatura e umidade' },
]

// Valor fora da lista (ex.: cadastrado antes) aparece legivel, sem quebrar a tela.
export function rotuloTipoSensor(valor: string) {
  const conhecido = TIPOS_SENSOR.find((tipo) => tipo.value === valor)
  if (conhecido) return conhecido.label
  const texto = valor.replace(/[_-]/g, ' ').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
