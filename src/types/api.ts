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

export interface Cultura {
  id: number
  nome: string
  variedade: string | null
  descricao: string | null
  temperaturaMin: number
  temperaturaMax: number
  umidadeMin: number
  umidadeMax: number
}

export interface CulturaPayload {
  nome: string
  variedade: string | null
  descricao: string | null
  temperaturaMin: number
  temperaturaMax: number
  umidadeMin: number
  umidadeMax: number
}

export interface CulturaResumo {
  id: number
  nome: string
  variedade: string | null
}

export interface Lote {
  id: number
  identificacao: string
  area: number
  dataPlantacao: string
  colheitaEstimada: string | null
  situacao: string
  status: StatusRegistro
  latitude: number | null
  longitude: number | null
  propriedadeId: number
  culturaId: number
  cultura: CulturaResumo
  totalSensores: number
}

// Campos que podem ser editados (PUT parcial). A propriedade de um lote nunca muda.
export interface LoteCampos {
  identificacao: string
  area: number
  dataPlantacao: string
  colheitaEstimada: string | null
  situacao: string
  culturaId: number
}

export interface LotePayload extends LoteCampos {
  propriedadeId: number
}

export interface Sensor {
  id: number
  codigo: string
  tipo: string
  localizacao: string | null
  dataInstalacao: string
  status: StatusRegistro
  loteId: number
  lote: { id: number; identificacao: string }
}

export interface SensorPayload {
  codigo: string
  tipo: string
  localizacao: string | null
  dataInstalacao: string
  loteId: number
}
