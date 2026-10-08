// "2026-03-12" -> "12/03/2026". Troca so o texto, sem criar Date (evita deslocar o dia por fuso horario).
export function formatarData(dataIso: string | null | undefined) {
  if (!dataIso) return '—'
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataIso
}

// Data de hoje no horario local, no formato AAAA-MM-DD (para o max de um campo de data).
export function hojeIso() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}
