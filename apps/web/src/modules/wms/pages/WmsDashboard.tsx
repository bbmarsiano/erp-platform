import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const warehouses = useWarehouses()
  const stockSummary = useStockSummary()
  const lowStock = useLowStock()
  const receipts = useReceipts()
  const lowStockData = (lowStock.data ?? []) as Array<{ id: string }>

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

      {lowStockData && lowStockData.length > 0 ? (
        <div
          onClick={() => navigate('/wms/stock')}
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ⚠️ {lowStockData.length} артикул(а) под минималната наличност.
          <span style={{ textDecoration: 'underline', fontWeight: 500 }}>Виж наличности →</span>
        </div>
      ) : null}
    </div>
  )
}

