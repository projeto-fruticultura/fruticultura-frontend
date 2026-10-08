// Mensagem de erro logo abaixo de um campo do formulario de cultura (nada aparece sem erro).
export function ErroCampo({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null

  return (
    <p id={`${id}-erro`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
      {mensagem}
    </p>
  )
}
