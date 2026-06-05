import { Route, Routes } from 'react-router-dom'
import ReportsPlaceholder from '../../components/ReportsPlaceholder'
import DeliveryDetail from './pages/DeliveryDetail'
import Deliveries from './pages/Deliveries'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import PurchaseOrders from './pages/PurchaseOrders'
import ScmDashboard from './pages/ScmDashboard'
import Suppliers from './pages/Suppliers'

export default function ScmRouter() {
  return (
    <Routes>
      <Route index element={<ScmDashboard />} />
      <Route path="suppliers" element={<Suppliers />} />
      <Route path="orders" element={<PurchaseOrders />} />
      <Route path="orders/:id" element={<PurchaseOrderDetail />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="deliveries/:id" element={<DeliveryDetail />} />
      <Route path="reports" element={<ReportsPlaceholder module="Верига на доставките" />} />
    </Routes>
  )
}
