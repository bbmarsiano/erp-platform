import { Route, Routes } from 'react-router-dom'
import ReportsPlaceholder from '../../components/ReportsPlaceholder'
import BomDetail from './pages/BomDetail'
import BomList from './pages/BomList'
import MesDashboard from './pages/MesDashboard'
import WorkOrderDetail from './pages/WorkOrderDetail'
import WorkOrders from './pages/WorkOrders'

export default function MesRouter() {
  return (
    <Routes>
      <Route index element={<MesDashboard />} />
      <Route path="bom" element={<BomList />} />
      <Route path="bom/:productId" element={<BomDetail />} />
      <Route path="orders" element={<WorkOrders />} />
      <Route path="orders/:id" element={<WorkOrderDetail />} />
      <Route path="reports" element={<ReportsPlaceholder module="Производство" />} />
    </Routes>
  )
}
