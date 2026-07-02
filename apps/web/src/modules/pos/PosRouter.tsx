import { Route, Routes } from 'react-router-dom'
import Counterparties from './pages/Counterparties'
import CounterpartyDetail from './pages/CounterpartyDetail'
import PosDashboard from './pages/PosDashboard'
import PosInvoiceDetail from './pages/PosInvoiceDetail'
import PosInvoices from './pages/PosInvoices'
import PosReports from './pages/Reports'
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
      <Route path="reports" element={<PosReports />} />
      <Route path="counterparties" element={<Counterparties />} />
      <Route path="counterparties/:id" element={<CounterpartyDetail />} />
      <Route path="invoices" element={<PosInvoices />} />
      <Route path="invoices/:id" element={<PosInvoiceDetail />} />
    </Routes>
  )
}
