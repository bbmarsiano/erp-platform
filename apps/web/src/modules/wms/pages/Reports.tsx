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
import { api } from '../../../lib/api'

type Period = '7d' | '30d' | '90d' | 'custom'

function getPeriodDates(period: Period, custom: { from: string; to: string }) {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  if (period === 'custom') return { dateFrom: custom.from, dateTo: custom.to }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr }
}

export default function WmsReports() {
  const [period, setPeriod] = useState<Period>('30d')
  const [custom, setCustom] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  })
  const [activeTab, setActiveTab] = useState<'movements' | 'stock' | 'receipts'>('movements')

  const { dateFrom, dateTo } = getPeriodDates(period, custom)

  const movementsQ = useQuery({
    queryKey: ['wms', 'reports', 'movements', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/wms/reports/movements-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'movements'
  })

  const stockQ = useQuery({
    queryKey: ['wms', 'reports', 'stock'],
    queryFn: () => api.get('/api/wms/reports/stock-by-product').then((r) => r.data.data),
    enabled: activeTab === 'stock'
  })

  const receiptsQ = useQuery({
    queryKey: ['wms', 'reports', 'receipts', dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/wms/reports/receipts-by-period?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then((r) => r.data.data),
    enabled: activeTab === 'receipts'
  })

  const exportExcel = useCallback(() => {
    let rows: Record<string, string | number>[] = []
    let sheetName = ''

    if (activeTab === 'movements' && movementsQ.data) {
      sheetName = 'Движения'
      rows = movementsQ.data.movements.map(
        (m: {
          movementType: string
          product?: { name: string; code: string; unit: string }
          quantity: number
          createdAt: string
        }) => ({
          Тип: m.movementType === 'IN' ? 'Вход' : 'Изход',
          Артикул: m.product?.name || '',
          Код: m.product?.code || '',
          Количество: m.quantity,
          'М.Е.': m.product?.unit || '',
          Дата: new Date(m.createdAt).toLocaleDateString('bg-BG')
        })
      )
    } else if (activeTab === 'stock' && stockQ.data) {
      sheetName = 'Наличности'
      rows = stockQ.data.map(
        (p: {
          name: string
          code: string
          quantity: number
          unit: string
          minStock: number
          status: string
        }) => ({
          Артикул: p.name,
          Код: p.code,
          Наличност: p.quantity,
          'М.Е.': p.unit,
          'Мин. наличност': p.minStock,
          Статус: p.status
        })
      )
    } else if (activeTab === 'receipts' && receiptsQ.data) {
      sheetName = 'Приходи'
      rows = receiptsQ.data.receipts.map(
        (r: {
          receiptNo: string
          warehouse?: { name: string }
          supplierName?: string
          status: string
          createdAt: string
        }) => ({
          Номер: r.receiptNo,
          Склад: r.warehouse?.name || '',
          Доставчик: r.supplierName || '',
          Статус: r.status,
          Дата: new Date(r.createdAt).toLocaleDateString('bg-BG')
        })
      )
    }

    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `WMS_${sheetName}_${dateFrom}_${dateTo}.xlsx`)
  }, [activeTab, movementsQ.data, stockQ.data, receiptsQ.data, dateFrom, dateTo])

  const tabs = [
    { id: 'movements', label: 'Движения' },
    { id: 'stock', label: 'Наличности' },
    { id: 'receipts', label: 'Приходи' }
  ]

  const periods = [
    { id: '7d', label: '7 дни' },
    { id: '30d', label: '30 дни' },
    { id: '90d', label: '90 дни' },
    { id: 'custom', label: 'По избор' }
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
            Справки
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Складово стопанство — анализи и отчети
          </p>
        </div>
        <button
          onClick={exportExcel}
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
      </div>

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
            onClick={() => setPeriod(p.id as Period)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              cursor: 'pointer',
              border: period === p.id ? 'none' : '1px solid #e5e7eb',
              background: period === p.id ? '#7c3aed' : 'white',
              color: period === p.id ? 'white' : '#374151',
              fontWeight: period === p.id ? 600 : 400,
              transition: 'all 0.15s'
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
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              style={{
                padding: '5px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13
              }}
            />
            <span style={{ color: '#9ca3af' }}>—</span>
            <input
              type="date"
              value={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              style={{
                padding: '5px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '9px 18px',
              border: 'none',
              cursor: 'pointer',
              background: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'movements' && (
        <MovementsReport data={movementsQ.data} loading={movementsQ.isLoading} />
      )}
      {activeTab === 'stock' && <StockReport data={stockQ.data} loading={stockQ.isLoading} />}
      {activeTab === 'receipts' && (
        <ReceiptsReport data={receiptsQ.data} loading={receiptsQ.isLoading} />
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color
}: {
  label: string
  value: string | number
  sub?: string
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
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color || '#0f172a',
          letterSpacing: '-0.5px'
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
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
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>
        {title}
      </div>
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

function MovementsReport({ data, loading }: { data: MovementsReportData | undefined; loading: boolean }) {
  if (loading) return <LoadingState />
  if (!data) return <LoadingState />

  const { chart, movements, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard
          label="Общо вход"
          value={summary.totalIn}
          sub={`${summary.totalInQty} бр.`}
          color="#059669"
        />
        <KpiCard
          label="Общо изход"
          value={summary.totalOut}
          sub={`${summary.totalOutQty} бр.`}
          color="#dc2626"
        />
        <KpiCard label="Общо движения" value={summary.totalIn + summary.totalOut} />
      </div>

      <ChartCard title="Движения по дни">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chart} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="inQty" name="Вход (кол.)" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outQty" name="Изход (кол.)" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Детайли (${movements.length} записа)`}>
        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Тип', 'Артикул', 'Количество', 'Дата'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 12
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 100).map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: m.movementType === 'IN' ? '#dcfce7' : '#fee2e2',
                        color: m.movementType === 'IN' ? '#166534' : '#991b1b'
                      }}
                    >
                      {m.movementType === 'IN' ? 'Вход' : 'Изход'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {m.product?.name}
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.product?.code}</div>
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: 700,
                      color: m.movementType === 'IN' ? '#059669' : '#dc2626'
                    }}
                  >
                    {m.movementType === 'IN' ? '+' : '-'}
                    {m.quantity} {m.product?.unit}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af' }}>
                    {new Date(m.createdAt).toLocaleDateString('bg-BG')}
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

function StockReport({
  data,
  loading
}: {
  data: StockProductRow[] | undefined
  loading: boolean
}) {
  if (loading || !data) return <LoadingState />

  const low = data.filter((p) => p.status === 'Под минимум').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Общо артикули" value={data.length} />
        <KpiCard label="Под минимум" value={low} color={low > 0 ? '#dc2626' : '#059669'} />
        <KpiCard label="Нормални" value={data.length - low} color="#059669" />
      </div>

      <ChartCard title="Наличности по артикул">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 15)} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
            <Tooltip />
            <Bar dataKey="quantity" name="Наличност" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            <Bar dataKey="minStock" name="Минимум" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Детайли по артикул">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Артикул', 'Код', 'Наличност', 'Мин.', 'Статус'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 12
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {p.code}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: 700,
                      color: p.status === 'Под минимум' ? '#dc2626' : '#059669'
                    }}
                  >
                    {p.quantity} {p.unit}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af' }}>
                    {p.minStock} {p.unit}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: p.status === 'Под минимум' ? '#fee2e2' : '#dcfce7',
                        color: p.status === 'Под минимум' ? '#991b1b' : '#166534'
                      }}
                    >
                      {p.status}
                    </span>
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

function ReceiptsReport({
  data,
  loading
}: {
  data: ReceiptsReportData | undefined
  loading: boolean
}) {
  if (loading || !data) return <LoadingState />
  const { chart, receipts, summary } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <KpiCard label="Общо приходи" value={summary.total} />
        <KpiCard label="Потвърдени" value={summary.confirmed} color="#059669" />
        <KpiCard label="Чернови" value={summary.draft} color="#d97706" />
      </div>

      <ChartCard title="Приходи по дни">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chart} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              name="Брой приходи"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: '#7c3aed', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Приходни бележки (${receipts.length})`}>
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Номер', 'Склад', 'Доставчик', 'Статус', 'Дата'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 12
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>
                    {r.receiptNo}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{r.warehouse?.name}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.supplierName || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: r.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3',
                        color: r.status === 'CONFIRMED' ? '#166534' : '#854d0e'
                      }}
                    >
                      {r.status === 'CONFIRMED' ? 'Потвърден' : 'Чернова'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleDateString('bg-BG')}
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

interface StockProductRow {
  name: string
  code: string
  unit: string
  quantity: number
  minStock: number
  status: string
}

interface MovementsReportData {
  chart: Array<{ date: string; in: number; out: number; inQty: number; outQty: number }>
  movements: Array<{
    id: string
    movementType: string
    quantity: number
    createdAt: string
    product?: { name: string; code: string; unit: string }
  }>
  summary: {
    totalIn: number
    totalOut: number
    totalInQty: number
    totalOutQty: number
  }
}

interface ReceiptsReportData {
  chart: Array<{ date: string; count: number }>
  receipts: Array<{
    id: string
    receiptNo: string
    supplierName?: string
    status: string
    createdAt: string
    warehouse?: { name: string }
  }>
  summary: { total: number; confirmed: number; draft: number }
}
