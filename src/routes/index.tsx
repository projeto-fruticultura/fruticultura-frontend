import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import Cadastro from '@/pages/Auth/Cadastro'
import EsqueciSenha from '@/pages/Auth/EsqueciSenha'
import Login from '@/pages/Auth/Login'
import RedefinirSenha from '@/pages/Auth/RedefinirSenha'
import Home from '@/pages/Home/Home'
import Propriedades from '@/pages/Propriedades/Propriedades'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/propriedades" element={<Propriedades />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
