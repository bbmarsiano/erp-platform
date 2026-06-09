import { Routes, Route } from 'react-router-dom'
import WmsDashboard from './pages/WmsDashboard'
import WmsReports from './pages/Reports'
import Warehouses from './pages/Warehouses'
import Stock from './pages/Stock'
import Receipts from './pages/Receipts'
import ReceiptDetail from './pages/ReceiptDetail'
import Issues from './pages/Issues'
import IssueDetail from './pages/IssueDetail'
import Movements from './pages/Movements'
import Products from './pages/Products'

export default function WmsRouter() {
  return (
    <Routes>
      <Route index element={<WmsDashboard />} />
      <Route path="warehouses" element={<Warehouses />} />
      <Route path="products" element={<Products />} />
      <Route path="stock" element={<Stock />} />
      <Route path="receipts" element={<Receipts />} />
      <Route path="receipts/:id" element={<ReceiptDetail />} />
      <Route path="issues" element={<Issues />} />
      <Route path="issues/:id" element={<IssueDetail />} />
      <Route path="movements" element={<Movements />} />
      <Route path="reports" element={<WmsReports />} />
    </Routes>
  )
}
