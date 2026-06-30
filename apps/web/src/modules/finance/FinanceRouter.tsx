import { Route, Routes } from 'react-router-dom'
import ChartOfAccounts from './pages/ChartOfAccounts'
import Customers from './pages/Customers'
import FinanceDashboard from './pages/FinanceDashboard'
import InvoiceDetail from './pages/InvoiceDetail'
import Invoices from './pages/Invoices'
import Payables from './pages/Payables'
import Receivables from './pages/Receivables'

export default function FinanceRouter() {
  return (
    <Routes>
      <Route index element={<FinanceDashboard />} />
      <Route path="customers" element={<Customers />} />
      <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
      <Route path="invoices" element={<Invoices />} />
      <Route path="invoices/:id" element={<InvoiceDetail />} />
      <Route path="receivables" element={<Receivables />} />
      <Route path="payables" element={<Payables />} />
    </Routes>
  )
}
