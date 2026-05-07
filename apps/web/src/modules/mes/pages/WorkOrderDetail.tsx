import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { useCompleteWorkOrder, useReleaseWorkOrder, useStartWorkOrder, useWorkOrder } from '../hooks/useMes'

const woStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  RELEASED: { label: 'Пуснато', bg: '#dbeafe', color: '#1e40af' },
  IN_PROGRESS: { label: 'В изпълнение', bg: '#fed7aa', color: '#9a3412' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
}

export default function WorkOrderDetail() {
  const { id = '' } = useParams()
  const workOrderQuery = useWorkOrder(id)
  const release = useReleaseWorkOrder()
  const start = useStartWorkOrder()
  const complete = useCompleteWorkOrder()
  const wo = workOrderQuery.data as any

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Нареждане {wo?.orderNo ?? ''}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {wo?.status === 'DRAFT' ? <Button onClick={() => release.mutate(id)}>Пусни</Button> : null}
          {wo?.status === 'RELEASED' ? <Button onClick={() => start.mutate(id)}>Започни</Button> : null}
          {wo?.status === 'IN_PROGRESS' ? <Button onClick={() => complete.mutate(id)} style={{ background: '#16a34a' }}>Завърши</Button> : null}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Link to="/mes/orders">← Назад</Link>
      </div>

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <div>Продукт: <strong>{wo?.product?.name ?? '-'}</strong></div>
          <div>Статус: <span style={{ background: woStatusMap[wo?.status]?.bg, color: woStatusMap[wo?.status]?.color, borderRadius: 20, padding: '2px 10px' }}>{woStatusMap[wo?.status]?.label ?? wo?.status}</span></div>
          <div>Планирано: <strong>{wo?.plannedQty ?? '-'}</strong></div>
          <div>Начало/Край: <strong>{wo?.actualStart ? new Date(wo.actualStart).toLocaleString('bg-BG') : '-'} / {wo?.actualEnd ? new Date(wo.actualEnd).toLocaleString('bg-BG') : '-'}</strong></div>
        </div>
      </div>

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Консумации</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Компонент</th>
              <th style={{ padding: 8 }}>Планирано кол.</th>
              <th style={{ padding: 8 }}>Изписано кол.</th>
              <th style={{ padding: 8 }}>Локация</th>
            </tr>
          </thead>
          <tbody>
            {(wo?.consumptions ?? []).map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{c.product?.name}</td>
                <td style={{ padding: 8 }}>{c.plannedQty}</td>
                <td style={{ padding: 8 }}>{c.consumedQty}</td>
                <td style={{ padding: 8 }}>{c.location?.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {wo?.status === 'COMPLETED' ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #86efac', borderRadius: 10, background: '#f0fdf4', color: '#166534' }}>
          ✅ Произведено: {wo.producedQty} бр. → Локация: {wo.outputLocation?.code}
        </div>
      ) : null}
    </div>
  )
}

