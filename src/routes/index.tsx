import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import Cadastro from "@/pages/Auth/Cadastro";
import EsqueciSenha from "@/pages/Auth/EsqueciSenha";
import Login from "@/pages/Auth/Login";
import RedefinirSenha from "@/pages/Auth/RedefinirSenha";
import Home from "@/pages/Home/Home";
import DetalhePropriedade from "@/pages/Propriedades/DetalhePropriedade";
import EditarPropriedade from "@/pages/Propriedades/EditarPropriedade";
import NovaPropriedade from "@/pages/Propriedades/NovaPropriedade";
import Propriedades from "@/pages/Propriedades/Propriedades";
import Culturas from "@/pages/Culturas/Culturas";
import NovaCultura from "@/pages/Culturas/NovaCultura";
import DetalheCultura from "@/pages/Culturas/DetalheCultura";
import EditarCultura from "@/pages/Culturas/EditarCultura";
import Sensores from "@/pages/Sensores/Sensores";
import NovoSensor from "@/pages/Sensores/NovoSensor";
import EditarSensor from "@/pages/Sensores/EditarSensor";
import Dashboard from '@/pages/Dashboard/Dashboard'
import Lotes from "@/pages/Lotes/Lotes";
import NovoLote from "@/pages/Lotes/NovoLote";
import EditarLote from "@/pages/Lotes/EditarLote";

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
            <Route path="/painel" element={<Dashboard />} />
            <Route path="/propriedades" element={<Propriedades />} />
            <Route path="/propriedades/nova" element={<NovaPropriedade />} />
            <Route path="/propriedades/:id" element={<DetalhePropriedade />} />
            <Route
              path="/propriedades/:id/editar"
              element={<EditarPropriedade />}
            />
            <Route path="/culturas" element={<Culturas />} />
            <Route path="/culturas/nova" element={<NovaCultura />} />
            <Route path="/sensores" element={<Sensores />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/lotes/novo" element={<NovoLote />} />
            <Route path="/lotes/:id/editar" element={<EditarLote />} />
            <Route path="/sensores/novo" element={<NovoSensor />} />
            <Route path="/sensores/:id/editar" element={<EditarSensor />} />
            <Route path="/culturas/:id" element={<DetalheCultura />} />
            <Route path="/culturas/:id/editar" element={<EditarCultura />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
