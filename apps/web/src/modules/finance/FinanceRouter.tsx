import { Route, Routes } from 'react-router-dom'
import ChartOfAccounts from './pages/ChartOfAccounts'
import Customers from './pages/Customers'
import FinanceDashboard from './pages/FinanceDashboard'

export default function FinanceRouter() {
  return (
    <Routes>
      <Route index element={<FinanceDashboard />} />
      <Route path="customers" element={<Customers />} />
      <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
    </Routes>
  )
}
