import { Route, Routes } from 'react-router-dom'
import BankAccounts from './pages/BankAccounts'
import BankTransactions from './pages/BankTransactions'
import ChartOfAccounts from './pages/ChartOfAccounts'
import Customers from './pages/Customers'
import FinanceDashboard from './pages/FinanceDashboard'
import FinanceReports from './pages/FinanceReports'
import FinancialPeriods from './pages/FinancialPeriods'
import InvoiceDetail from './pages/InvoiceDetail'
import Invoices from './pages/Invoices'
import JournalEntries from './pages/JournalEntries'
import JournalEntryDetail from './pages/JournalEntryDetail'
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
      <Route path="journal-entries" element={<JournalEntries />} />
      <Route path="journal-entries/:id" element={<JournalEntryDetail />} />
      <Route path="bank-accounts" element={<BankAccounts />} />
      <Route path="bank-transactions" element={<BankTransactions />} />
      <Route path="reports" element={<FinanceReports />} />
      <Route path="periods" element={<FinancialPeriods />} />
    </Routes>
  )
}
