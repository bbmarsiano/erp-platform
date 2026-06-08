import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { api } from '../../../lib/api'

type Period = '7d' | '30d' | '90d' | 'custom'

const workOrderLabels: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#f3f4f6', color: '#374151' },
  RELEASED: { label: 'Планирано', bg: '#dbeafe', color: '#1e40af' },
  IN_PROGRESS: { label: 'В изпълнение', bg: '#fef9c3', color: '#854d0e' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
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

export default function MesReports() {
  const [period, setPeriod] = useState<Period>('30d')
  const [custom, setCustom] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  })
  const [activeTab, setActiveTab] = useState<'orders' | 'bom'>('orders')
  const { dateFrom, dateTo } = getPeriodDates(period, custom)

  const ordersQ = useQuery({
    queryKey: ['mes', 'reports', 'orders', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/mes/reports/orders-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'orders'
  })

  const bomQ = useQuery({
    queryKey: ['mes', 'reports', 'bom'],
    queryFn: () => api.get('/api/mes/reports/bom-summary').then((r) => r.data.data),
    enabled: activeTab === 'bom'
  })

  const exportExcel = useCallback(() => {
    let rows: Record<string, string | number>[] = []
    let sheetName = ''

    if (activeTab === 'orders' && ordersQ.data) {
      sheetName = 'Нареждания'
      rows = ordersQ.data.orders.map(
        (o: {
          orderNo: string
          product?: { name: string }
          plannedQty: number
          status: string
          createdAt: string
        }) => ({
          Номер: o.orderNo,
          Продукт: o.product?.name || '',
          Количество: o.plannedQty,
          Статус: workOrderLabels[o.status]?.label || o.status,
          Дата: new Date(o.createdAt).toLocaleDateString('bg-BG')
        })
      )
    } else if (activeTab === 'bom' && bomQ.data) {
      sheetName = 'Рецептури'
      rows = bomQ.data.map(
        (b: { name: string; product: string; productCode: string; version: string; components: number; isActive: boolean }) => ({
          Наименование: b.name,
          Продукт: b.product,
          Код: b.productCode,
          Версия: b.version,
          Компоненти: b.components,
          Статус: b.isActive ? 'Активна' : 'Неактивна'
        })
      )
    }

    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `MES_${sheetName}_${dateFrom}_${dateTo}.xlsx`)
  }, [activeTab, ordersQ.data, bomQ.data, dateFrom, dateTo])

  const tabs = [
    { id: 'orders', label: 'Производствени нареждания' },
    { id: 'bom', label: 'Рецептури' }
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>Справки</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Производство — анализи и отчети</p>
        </div>
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
      </div>

      {activeTab === 'orders' && (
        <PeriodBar period={period} custom={custom} onPeriod={setPeriod} onCustom={setCustom} />
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'none',
              fontSize: 14, fontWeight: 500,
              color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && <OrdersReport data={ordersQ.data} loading={ordersQ.isLoading} />}
      {activeTab === 'bom' && <BomReport data={bomQ.data} loading={bomQ.isLoading} />}
    </div>
  )
}

function PeriodBar({
  period,
  custom,
  onPeriod,
  onCustom
}: {
  period: Period
  custom: { from: string; to: string }
  onPeriod: (p: Period) => void
  onCustom: (c: { from: string; to: string }) => void
}) {
  const periods = [
    { id: '7d', label: '7 дни' },
    { id: '30d', label: '30 дни' },
    { id: '90d', label: '90 дни' },
    { id: 'custom', label: 'По избор' }
  ]
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Период:</span>
      {periods.map((p) => (
        <button key={p.id} onClick={() => onPeriod(p.id as Period)} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
          border: period === p.id ? 'none' : '1px solid #e5e7eb',
          background: period === p.id ? '#7c3aed' : 'white',
          color: period === p.id ? 'white' : '#374151', fontWeight: period === p.id ? 600 : 400
        }}>{p.label}</button>
      ))}
      {period === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <input type="date" value={custom.from} onChange={(e) => onCustom({ ...custom, from: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
          <span style={{ color: '#9ca3af' }}>—</span>
          <input type="date" value={custom.to} onChange={(e) => onCustom({ ...custom, to: e.target.value })}
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', flex: '1 1 0' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#0f172a' }}>{value}</div>
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

function OrdersReport({ data, loading }: { data: MesOrdersData | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const { chart, orders, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Общо" value={summary.total} />
        <KpiCard label="В изпълнение" value={summary.inProgress} color="#d97706" />
        <KpiCard label="Завършени" value={summary.completed} color="#059669" />
        <KpiCard label="Планирани" value={summary.planned} color="#1e40af" />
        <KpiCard label="Общо количество" value={summary.totalQty} />
      </div>
      <ChartCard title="Нареждания по дни">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" name="Брой нареждания" stroke="#f5576c" strokeWidth={2} dot={{ fill: '#f5576c', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={`Нареждания (${orders.length})`}>
        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Номер', 'Продукт', 'Количество', 'Статус', 'Дата'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = workOrderLabels[o.status] || { label: o.status, bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{o.orderNo}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{o.product?.name}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>{o.plannedQty} {o.product?.unit}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{new Date(o.createdAt).toLocaleDateString('bg-BG')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

function BomReport({ data, loading }: { data: BomRow[] | undefined; loading: boolean }) {
  if (loading || !data) return <LoadingState />
  const active = data.filter((b) => b.isActive).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Общо рецептури" value={data.length} />
        <KpiCard label="Активни" value={active} color="#059669" />
      </div>
      <ChartCard title="Рецептури">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Наименование', 'Продукт', 'Версия', 'Компоненти', 'Статус'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.productCode} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{b.name}</td>
                  <td style={{ padding: '8px 12px' }}>{b.product}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{b.version}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{b.components}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: b.isActive ? '#dcfce7' : '#f3f4f6',
                      color: b.isActive ? '#166534' : '#6b7280'
                    }}>{b.isActive ? 'Активна' : 'Неактивна'}</span>
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

interface BomRow {
  name: string
  product: string
  productCode: string
  version: string
  components: number
  isActive: boolean
}

interface MesOrdersData {
  chart: Array<{ date: string; count: number }>
  orders: Array<{
    id: string
    orderNo: string
    plannedQty: number
    status: string
    createdAt: string
    product?: { name: string; unit: string }
  }>
  summary: {
    total: number
    inProgress: number
    completed: number
    planned: number
    cancelled: number
    totalQty: number
  }
}
