import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Download } from 'lucide-react'
import { PageHeader } from '../../../components/ui'
import { formatCurrency, CURRENCY_SYMBOL } from '../../../lib/currency'
import * as XLSX from 'xlsx'
import { api } from '../../../lib/api'

type Period = '7d' | '30d' | '90d' | 'custom'

const paymentLabels: Record<string, string> = {
  CASH: 'Кеш',
  CARD: 'Карта',
  MIXED: 'Смесено'
}

function getPeriodDates(period: Period, custom: { from: string; to: string }) {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  if (period === 'custom') return { dateFrom: custom.from, dateTo: custom.to }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr }
}

export default function PosReports() {
  const [period, setPeriod] = useState<Period>('30d')
  const [custom, setCustom] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  })
  const [activeTab, setActiveTab] = useState<'sales' | 'products'>('sales')
  const { dateFrom, dateTo } = getPeriodDates(period, custom)

  const salesQ = useQuery({
    queryKey: ['pos', 'reports', 'sales', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/pos/reports/sales-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'sales'
  })

  const productsQ = useQuery({
    queryKey: ['pos', 'reports', 'products', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/pos/reports/top-products?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'products'
  })

  const exportExcel = useCallback(() => {
    let rows: Record<string, string | number>[] = []
    let sheetName = ''

    if (activeTab === 'sales' && salesQ.data) {
      sheetName = 'Продажби'
      rows = salesQ.data.sales.map(
        (s: {
          saleNo: string
          cashRegister?: { name: string }
          paymentMethod: string
          totalAmount: number
          createdAt: string
        }) => ({
          Номер: s.saleNo,
          Каса: s.cashRegister?.name || '',
          Метод: paymentLabels[s.paymentMethod] || s.paymentMethod,
          Сума: s.totalAmount,
          Дата: new Date(s.createdAt).toLocaleDateString('bg-BG')
        })
      )
    } else if (activeTab === 'products' && productsQ.data) {
      sheetName = 'Топ артикули'
      rows = productsQ.data.map(
        (p: { name: string; code: string; qty: number; revenue: number }) => ({
          Артикул: p.name,
          Код: p.code,
          Количество: p.qty,
          Приход: p.revenue
        })
      )
    }

    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `POS_${sheetName}_${dateFrom}_${dateTo}.xlsx`)
  }, [activeTab, salesQ.data, productsQ.data, dateFrom, dateTo])

  const tabs = [
    { id: 'sales', label: 'Продажби' },
    { id: 'products', label: 'Топ артикули' }
  ]

  const periods = [
    { id: '7d', label: '7 дни' },
    { id: '30d', label: '30 дни' },
    { id: '90d', label: '90 дни' },
    { id: 'custom', label: 'По избор' }
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Справки"
        subtitle="Точка на продажба — анализи и отчети"
        action={
          <button
            onClick={exportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              background: '#16a34a', color: 'white', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
            }}
          >
            <Download size={15} />
            Експорт Excel
          </button>
        }
      />

      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Период:</span>
        {periods.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id as Period)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            border: period === p.id ? 'none' : '1px solid #e5e7eb',
            background: period === p.id ? '#7c3aed' : 'white',
            color: period === p.id ? 'white' : '#374151', fontWeight: period === p.id ? 600 : 400
          }}>{p.label}</button>
        ))}
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
            <span style={{ color: '#9ca3af' }}>—</span>
            <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
            padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'none', fontSize: 14, fontWeight: 500,
            color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
            borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: -1
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'sales' && <SalesReport data={salesQ.data} loading={salesQ.isLoading} />}
      {activeTab === 'products' && <ProductsReport data={productsQ.data} loading={productsQ.isLoading} />}
    </div>
  )
}

function KpiCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', flex: '1 1 0' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  )
}

function LoadingState() {
  return <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 14 }}>Зареждане...</div>
}

function SalesReport({ data, loading }: { data: SalesReportData | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const { chart, sales, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Общо продажби" value={summary.total} />
        <KpiCard label="Приход" value={formatCurrency(summary.totalRevenue)} color="#059669" />
        <KpiCard label="Средна продажба" value={formatCurrency(summary.avgSale)} />
        <KpiCard label="Кеш" value={summary.cash} color="#d97706" />
        <KpiCard label="Карта" value={summary.card} color="#1e40af" />
      </div>
      <ChartCard title="Продажби по дни">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Брой" fill="#4facfe" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" name={`Приход (${CURRENCY_SYMBOL})`} fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={`Продажби (${sales.length})`}>
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Номер', 'Каса', 'Метод', 'Сума', 'Дата'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{s.saleNo}</td>
                  <td style={{ padding: '8px 12px' }}>{s.cashRegister?.name}</td>
                  <td style={{ padding: '8px 12px' }}>{paymentLabels[s.paymentMethod] || s.paymentMethod}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{formatCurrency(s.totalAmount)}</td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{new Date(s.createdAt).toLocaleDateString('bg-BG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function ProductsReport({ data, loading }: { data: ProductRow[] | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const totalQty = data.reduce((s, p) => s + p.qty, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Артикули продадени" value={totalQty} />
        <KpiCard label="Уникални артикули" value={data.length} color="#7c3aed" />
      </div>
      <ChartCard title="Топ 10 по приход">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
            <Tooltip />
            <Bar dataKey="revenue" name={`Приход (${CURRENCY_SYMBOL})`} fill="#4facfe" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Детайли по артикул">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Артикул', 'Код', 'Количество', 'Приход'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#6b7280' }}>{p.code}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.qty}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

interface ProductRow {
  name: string
  code: string
  qty: number
  revenue: number
}

interface SalesReportData {
  chart: Array<{ date: string; count: number; revenue: number }>
  sales: Array<{
    id: string
    saleNo: string
    paymentMethod: string
    totalAmount: number
    createdAt: string
    cashRegister?: { name: string }
  }>
  summary: {
    total: number
    totalRevenue: number
    avgSale: number
    cash: number
    card: number
  }
}
