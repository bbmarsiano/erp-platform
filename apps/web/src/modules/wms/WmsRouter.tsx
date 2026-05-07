import { Routes, Route } from 'react-router-dom'
import WmsDashboard from './pages/WmsDashboard'
import Warehouses from './pages/Warehouses'
import Stock from './pages/Stock'
import Receipts from './pages/Receipts'
import ReceiptDetail from './pages/ReceiptDetail'
import Issues from './pages/Issues'
import IssueDetail from './pages/IssueDetail'

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6, color: '#6b7280' }}>Тази секция ще бъде добавена в следващ етап.</div>
    </div>
  )
}

export default function WmsRouter() {
  return (
    <Routes>
      <Route index element={<WmsDashboard />} />
      <Route path="warehouses" element={<Warehouses />} />
      <Route path="stock" element={<Stock />} />
      <Route path="receipts" element={<Receipts />} />
      <Route path="receipts/:id" element={<ReceiptDetail />} />
      <Route path="issues" element={<Issues />} />
      <Route path="issues/:id" element={<IssueDetail />} />
      <Route path="movements" element={<Placeholder title="Движения" />} />
      <Route path="reports" element={<Placeholder title="Справки" />} />
    </Routes>
  )
}

