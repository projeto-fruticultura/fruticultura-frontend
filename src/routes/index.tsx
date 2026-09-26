import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home/Home'
import Propriedades from '@/pages/Propriedades/Propriedades'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/propriedades" element={<Propriedades />} />
      </Routes>
    </BrowserRouter>
  )
}