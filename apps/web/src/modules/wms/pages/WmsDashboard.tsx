import { useMemo } from 'react'
import { useLowStock, useReceipts, useStockSummary, useWarehouses } from '../hooks/useWms'

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 20
      }}
    >
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
      {subtitle ? <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>{subtitle}</div> : null}
    </div>
  )
}

export default function WmsDashboard() {
  const warehouses = useWarehouses()
  const stockSummary = useStockSummary()
  const lowStock = useLowStock()
  const receipts = useReceipts()

  const totals = useMemo(() => {
    const ws = (warehouses.data ?? []) as Array<{ id: string }>
    const summary = (stockSummary.data ?? []) as Array<{ totalItems: number; totalQuantity: number }>
    const low = (lowStock.data ?? []) as Array<{ id: string }>
    const rs = (receipts.data ?? []) as Array<{ status: string }>

    return {
      warehousesCount: ws.length,
      stockedItemsCount: summary.reduce((acc, s) => acc + (s.totalItems ?? 0), 0),
      draftReceiptsCount: rs.filter((r) => r.status === 'DRAFT').length,
      lowStockCount: low.length
    }
  }, [lowStock.data, receipts.data, stockSummary.data, warehouses.data])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Склад (WMS)</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>Обзор и ключови показатели</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <StatCard title="Общо складове" value={warehouses.isLoading ? '...' : totals.warehousesCount} />
        <StatCard title="Артикули с наличност" value={stockSummary.isLoading ? '...' : totals.stockedItemsCount} />
        <StatCard title="Чернови приходни" value={receipts.isLoading ? '...' : totals.draftReceiptsCount} />
        <StatCard title="Артикули под минимум" value={lowStock.isLoading ? '...' : totals.lowStockCount} />
      </div>

      {totals.lowStockCount > 0 ? (
        <div
          style={{
            marginTop: 14,
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 10,
            padding: 14,
            color: '#9a3412'
          }}
        >
          Има артикули под минимална наличност. Прегледайте справката „Ниски наличности“ в секция „Склад“.
        </div>
      ) : null}
    </div>
  )
}

