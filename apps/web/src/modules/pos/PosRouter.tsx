import { Route, Routes } from 'react-router-dom'
import PosDashboard from './pages/PosDashboard'
import Registers from './pages/Registers'
import SaleDetail from './pages/SaleDetail'
import Sales from './pages/Sales'

export default function PosRouter() {
  return (
    <Routes>
      <Route index element={<PosDashboard />} />
      <Route path="sales" element={<Sales />} />
      <Route path="sales/:id" element={<SaleDetail />} />
      <Route path="registers" element={<Registers />} />
    </Routes>
  )
}

