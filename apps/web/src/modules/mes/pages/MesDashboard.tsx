import { useMemo } from 'react'
import { useBoms, useWorkOrders } from '../hooks/useMes'

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

export default function MesDashboard() {
  const bomQuery = useBoms()
  const ordersQuery = useWorkOrders()

  const stats = useMemo(() => {
    const boms = (bomQuery.data ?? []) as Array<any>
    const orders = (ordersQuery.data ?? []) as Array<any>
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    return {
      activeBoms: boms.filter((b) => b.isActive).length,
      inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
      completedWeek: orders.filter((o) => o.status === 'COMPLETED' && o.actualEnd && new Date(o.actualEnd) >= weekStart).length,
      draftOrders: orders.filter((o) => o.status === 'DRAFT').length
    }
  }, [bomQuery.data, ordersQuery.data])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Производство</div>
      <div style={{ marginTop: 4, color: '#6b7280' }}>MES табло</div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Card title="Активни рецептури" value={stats.activeBoms} />
        <Card title="Нареждания в изпълнение" value={stats.inProgress} />
        <Card title="Завършени тази седмица" value={stats.completedWeek} />
        <Card title="Чернови нареждания" value={stats.draftOrders} />
      </div>
    </div>
  )
}

