import type { PerfilUsuario } from '@/types/api'

// Esconde os botoes de criar, editar e apagar para quem nao pode escrever.
// Quem decide de verdade e o backend (TECNICO recebe 403); aqui so se evita mostrar um botao que nao vai funcionar.
export function podeEscrever(perfil?: PerfilUsuario | null) {
  return perfil === 'ADMIN' || perfil === 'PRODUTOR'
}
