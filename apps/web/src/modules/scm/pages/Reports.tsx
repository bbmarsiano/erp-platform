import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '../../../components/ui'
import { api } from '../../../lib/api'

type Period = '7d' | '30d' | '90d' | 'custom'

const orderStatusLabels: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  SENT: { label: 'Изпратена', bg: '#dbeafe', color: '#1e40af' },
  RECEIVED: { label: 'Получена', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' },
  PARTIALLY_RECEIVED: { label: 'Частично', bg: '#fef9c3', color: '#854d0e' }
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

export default function ScmReports() {
  const [period, setPeriod] = useState<Period>('30d')
  const [custom, setCustom] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  })
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers' | 'deliveries'>('orders')
  const { dateFrom, dateTo } = getPeriodDates(period, custom)

  const ordersQ = useQuery({
    queryKey: ['scm', 'reports', 'orders', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/scm/reports/orders-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'orders'
  })

  const suppliersQ = useQuery({
    queryKey: ['scm', 'reports', 'suppliers'],
    queryFn: () => api.get('/api/scm/reports/suppliers-summary').then((r) => r.data.data),
    enabled: activeTab === 'suppliers'
  })

  const deliveriesQ = useQuery({
    queryKey: ['scm', 'reports', 'deliveries', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/scm/reports/deliveries-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'deliveries'
  })

  const exportExcel = useCallback(() => {
    let rows: Record<string, string | number>[] = []
    let sheetName = ''

    if (activeTab === 'orders' && ordersQ.data) {
      sheetName = 'Поръчки'
      rows = ordersQ.data.orders.map(
        (o: {
          orderNo: string
          supplier?: { name: string }
          status: string
          lines: unknown[]
          createdAt: string
        }) => ({
          Номер: o.orderNo,
          Доставчик: o.supplier?.name || '',
          Статус: orderStatusLabels[o.status]?.label || o.status,
          Редове: o.lines.length,
          Дата: new Date(o.createdAt).toLocaleDateString('bg-BG')
        })
      )
    } else if (activeTab === 'suppliers' && suppliersQ.data) {
      sheetName = 'Доставчици'
      rows = suppliersQ.data.map(
        (s: { name: string; code: string; total: number; received: number; isActive: boolean }) => ({
          Доставчик: s.name,
          Код: s.code,
          'Общо поръчки': s.total,
          Получени: s.received,
          Статус: s.isActive ? 'Активен' : 'Неактивен'
        })
      )
    } else if (activeTab === 'deliveries' && deliveriesQ.data) {
      sheetName = 'Доставки'
      rows = deliveriesQ.data.deliveries.map(
        (d: {
          deliveryNo: string
          supplierName?: string
          purchaseOrder?: { supplier?: { name: string } }
          status: string
          createdAt: string
        }) => ({
          Номер: d.deliveryNo,
          Доставчик: d.supplierName || d.purchaseOrder?.supplier?.name || '',
          Статус: d.status === 'CONFIRMED' ? 'Потвърдена' : 'Чернова',
          Дата: new Date(d.createdAt).toLocaleDateString('bg-BG')
        })
      )
    }

    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `SCM_${sheetName}_${dateFrom}_${dateTo}.xlsx`)
  }, [activeTab, ordersQ.data, suppliersQ.data, deliveriesQ.data, dateFrom, dateTo])

  const tabs = [
    { id: 'orders', label: 'Поръчки' },
    { id: 'suppliers', label: 'Доставчици' },
    { id: 'deliveries', label: 'Доставки' }
  ]

  const periods = [
    { id: '7d', label: '7 дни' },
    { id: '30d', label: '30 дни' },
    { id: '90d', label: '90 дни' },
    { id: 'custom', label: 'По избор' }
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ReportHeader
        subtitle="Верига на доставките — анализи и отчети"
        onExport={exportExcel}
      />
      <PeriodSelector
        period={period}
        custom={custom}
        periods={periods}
        onPeriodChange={setPeriod}
        onCustomChange={setCustom}
      />
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)} />

      {activeTab === 'orders' && <OrdersReport data={ordersQ.data} loading={ordersQ.isLoading} />}
      {activeTab === 'suppliers' && (
        <SuppliersReport data={suppliersQ.data} loading={suppliersQ.isLoading} />
      )}
      {activeTab === 'deliveries' && (
        <DeliveriesReport data={deliveriesQ.data} loading={deliveriesQ.isLoading} />
      )}
    </div>
  )
}

function ReportHeader({ subtitle, onExport }: { subtitle: string; onExport: () => void }) {
  return (
    <PageHeader
      title="Справки"
      subtitle={subtitle}
      help={{
        title: 'Справки — SCM',
        content:
          'Анализи на доставките — поръчки по период, активност на доставчиците и история на доставките с Excel export.'
      }}
      action={
        <button
          onClick={onExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
          }}
        >
          <Download size={15} />
          Експорт Excel
        </button>
      }
    />
  )
}

function PeriodSelector({
  period,
  custom,
  periods,
  onPeriodChange,
  onCustomChange
}: {
  period: Period
  custom: { from: string; to: string }
  periods: { id: string; label: string }[]
  onPeriodChange: (p: Period) => void
  onCustomChange: (c: { from: string; to: string }) => void
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Период:</span>
      {periods.map((p) => (
        <button
          key={p.id}
          onClick={() => onPeriodChange(p.id as Period)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            border: period === p.id ? 'none' : '1px solid #e5e7eb',
            background: period === p.id ? '#7c3aed' : 'white',
            color: period === p.id ? 'white' : '#374151',
            fontWeight: period === p.id ? 600 : 400
          }}
        >
          {p.label}
        </button>
      ))}
      {period === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <input
            type="date"
            value={custom.from}
            onChange={(e) => onCustomChange({ ...custom, from: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
          />
          <span style={{ color: '#9ca3af' }}>—</span>
          <input
            type="date"
            value={custom.to}
            onChange={(e) => onCustomChange({ ...custom, to: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
          />
        </div>
      )}
    </div>
  )
}

function TabBar({
  tabs,
  activeTab,
  onTabChange
}: {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '9px 18px',
            border: 'none',
            cursor: 'pointer',
            background: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
            borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
            marginBottom: -1
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function KpiCard({
  label,
  value,
  color
}: {
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '18px 20px',
        flex: '1 1 0'
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#0f172a' }}>{value}</div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '20px 24px'
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 14 }}>
      Зареждане...
    </div>
  )
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, { label: string; bg: string; color: string }> }) {
  const s = labels[status] || { label: status, bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color
      }}
    >
      {s.label}
    </span>
  )
}

function OrdersReport({ data, loading }: { data: OrdersReportData | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const { chart, orders, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Общо поръчки" value={summary.total} />
        <KpiCard label="Изпратени" value={summary.sent} color="#1e40af" />
        <KpiCard label="Получени" value={summary.received} color="#059669" />
        <KpiCard label="Чернови" value={summary.draft} color="#d97706" />
      </div>
      <ChartCard title="Поръчки по дни">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              name="Брой поръчки"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: '#7c3aed', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={`Поръчки (${orders.length})`}>
        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Номер', 'Доставчик', 'Статус', 'Редове', 'Дата'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{o.orderNo}</td>
                  <td style={{ padding: '8px 12px' }}>{o.supplier?.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <StatusBadge status={o.status} labels={orderStatusLabels} />
                  </td>
                  <td style={{ padding: '8px 12px' }}>{o.lines.length}</td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af' }}>
                    {new Date(o.createdAt).toLocaleDateString('bg-BG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function SuppliersReport({ data, loading }: { data: SupplierRow[] | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const active = data.filter((s) => s.isActive).length
  const withOrders = data.filter((s) => s.total > 0).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Общо доставчици" value={data.length} />
        <KpiCard label="Активни" value={active} color="#059669" />
        <KpiCard label="С поръчки" value={withOrders} color="#7c3aed" />
      </div>
      <ChartCard title="Поръчки по доставчик">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 15)} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Общо" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            <Bar dataKey="received" name="Получени" fill="#059669" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Детайли по доставчик">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Доставчик', 'Код', 'Общо поръчки', 'Получени'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#6b7280' }}>{s.code}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{s.total}</td>
                  <td style={{ padding: '8px 12px', color: '#059669', fontWeight: 600 }}>{s.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function DeliveriesReport({ data, loading }: { data: DeliveriesReportData | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const { chart, deliveries, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Общо доставки" value={summary.total} />
        <KpiCard label="Потвърдени" value={summary.confirmed} color="#059669" />
        <KpiCard label="Изчакващи" value={summary.pending} color="#d97706" />
      </div>
      <ChartCard title="Доставки по дни">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name="Брой доставки" fill="#11998e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={`Доставки (${deliveries.length})`}>
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Номер', 'Доставчик', 'Статус', 'Дата'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{d.deliveryNo}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {d.supplierName || d.purchaseOrder?.supplier?.name || '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: d.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3',
                        color: d.status === 'CONFIRMED' ? '#166534' : '#854d0e'
                      }}
                    >
                      {d.status === 'CONFIRMED' ? 'Потвърдена' : 'Чернова'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af' }}>
                    {new Date(d.createdAt).toLocaleDateString('bg-BG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

interface SupplierRow {
  name: string
  code: string
  total: number
  sent: number
  received: number
  isActive: boolean
}

interface OrdersReportData {
  chart: Array<{ date: string; count: number }>
  orders: Array<{
    id: string
    orderNo: string
    status: string
    createdAt: string
    supplier?: { name: string }
    lines: unknown[]
  }>
  summary: { total: number; sent: number; received: number; draft: number; cancelled: number }
}

interface DeliveriesReportData {
  chart: Array<{ date: string; count: number }>
  deliveries: Array<{
    id: string
    deliveryNo: string
    supplierName?: string
    status: string
    createdAt: string
    purchaseOrder?: { supplier?: { name: string } }
  }>
  summary: { total: number; confirmed: number; pending: number }
}
