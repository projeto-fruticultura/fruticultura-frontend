export type PerfilUsuario = 'PRODUTOR' | 'TECNICO' | 'ADMIN'
export type StatusRegistro = 'ATIVO' | 'INATIVO'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: PerfilUsuario
  status: StatusRegistro
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface MensagemResponse {
  mensagem: string
}

export interface ApiErrorBody {
  erro?: string
  campos?: Record<string, string>
}

export interface PropriedadeResumo {
  id: number
  nome: string
  cidade: string
  uf: string
  totalLotes: number
  totalSensores: number
}

export interface PropriedadeDetalhe extends PropriedadeResumo {
  area: number
  latitude: number
  longitude: number
  status: StatusRegistro
  usuarioId: number
  criadoEm: string
  atualizadoEm: string
}

export interface PropriedadePayload {
  nome: string
  area: number
  cidade: string
  uf: string
  latitude: number
  longitude: number
}
