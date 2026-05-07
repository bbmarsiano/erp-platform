import { useMemo } from 'react'
import { useDeliveries, usePurchaseOrders, useSuppliers } from '../hooks/useScm'

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

export default function ScmDashboard() {
  const suppliers = useSuppliers()
  const orders = usePurchaseOrders()
  const deliveries = useDeliveries()

  const stats = useMemo(() => {
    const s = (suppliers.data ?? []) as Array<{ isActive: boolean }>
    const o = (orders.data ?? []) as Array<{ status: string }>
    const d = (deliveries.data ?? []) as Array<{ createdAt: string }>
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    return {
      activeSuppliers: s.filter((x) => x.isActive).length,
      sentOrders: o.filter((x) => x.status === 'SENT').length,
      weekDeliveries: d.filter((x) => new Date(x.createdAt) >= weekStart).length,
      openOrders: o.filter((x) => x.status !== 'RECEIVED' && x.status !== 'CANCELLED').length
    }
  }, [deliveries.data, orders.data, suppliers.data])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Верига на доставките</div>
      <div style={{ marginTop: 4, color: '#6b7280' }}>SCM табло</div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Card title="Активни доставчици" value={suppliers.isLoading ? '...' : stats.activeSuppliers} />
        <Card title="Поръчки в изчакване" value={orders.isLoading ? '...' : stats.sentOrders} />
        <Card title="Доставки тази седмица" value={deliveries.isLoading ? '...' : stats.weekDeliveries} />
        <Card title="Незатворени поръчки" value={orders.isLoading ? '...' : stats.openOrders} />
      </div>
    </div>
  )
}

