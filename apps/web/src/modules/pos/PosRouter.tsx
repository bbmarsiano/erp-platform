import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { isFinanceModuleEnabledForTenant } from '../../lib/tenantModules'
import Counterparties from './pages/Counterparties'
import CounterpartyDetail from './pages/CounterpartyDetail'
import PosDashboard from './pages/PosDashboard'
import PosInvoiceDetail from './pages/PosInvoiceDetail'
import PosInvoices from './pages/PosInvoices'
import PosReports from './pages/Reports'
import Registers from './pages/Registers'
import SaleDetail from './pages/SaleDetail'
import Sales from './pages/Sales'

function PosFinanceDisabledRoute({ children }: { children: React.ReactNode }) {
  const enabledModules = useAuthStore((s) => s.enabledModules)
  const financeEnabled = isFinanceModuleEnabledForTenant({ enabledModules })

  if (financeEnabled) {
    return <Navigate to="/pos" replace />
  }

  return <>{children}</>
}

export default function PosRouter() {
  return (
    <Routes>
      <Route index element={<PosDashboard />} />
      <Route path="sales" element={<Sales />} />
      <Route path="sales/:id" element={<SaleDetail />} />
      <Route path="registers" element={<Registers />} />
      <Route path="reports" element={<PosReports />} />
      <Route
        path="counterparties"
        element={
          <PosFinanceDisabledRoute>
            <Counterparties />
          </PosFinanceDisabledRoute>
        }
      />
      <Route
        path="counterparties/:id"
        element={
          <PosFinanceDisabledRoute>
            <CounterpartyDetail />
          </PosFinanceDisabledRoute>
        }
      />
      <Route
        path="invoices"
        element={
          <PosFinanceDisabledRoute>
            <PosInvoices />
          </PosFinanceDisabledRoute>
        }
      />
      <Route
        path="invoices/:id"
        element={
          <PosFinanceDisabledRoute>
            <PosInvoiceDetail />
          </PosFinanceDisabledRoute>
        }
      />
    </Routes>
  )
}
