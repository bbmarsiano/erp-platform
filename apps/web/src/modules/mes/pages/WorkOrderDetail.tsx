import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader, StatusBadge } from '../../../components/ui'
import { useCompleteWorkOrder, useReleaseWorkOrder, useStartWorkOrder, useWorkOrder } from '../hooks/useMes'

const woStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  RELEASED: { label: 'Пуснато', bg: '#ede9fe', color: '#5b21b6' },
  IN_PROGRESS: { label: 'В изпълнение', bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left'
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14
}

function formatPlannedConsumption(c: any, wo: any): string {
  const unit = c.product?.unit ?? ''
  const bomItem = wo?.bom?.items?.find((i: any) => i.componentId === c.productId)
  if (bomItem) {
    const perUnit = `${bomItem.quantity}${unit}`
    const total = `${c.plannedQty}${unit}`
    return `${perUnit} × ${wo.plannedQty} = ${total}`
  }
  return unit ? `${c.plannedQty} ${unit}` : String(c.plannedQty)
}

function formatQty(value: number, unit?: string): string {
  return unit ? `${value}${unit}` : String(value)
}

export default function WorkOrderDetail() {
  const { id = '' } = useParams()
  const workOrderQuery = useWorkOrder(id)
  const release = useReleaseWorkOrder()
  const start = useStartWorkOrder()
  const complete = useCompleteWorkOrder()
  const wo = workOrderQuery.data as any

  const status = woStatusMap[wo?.status] ?? {
    label: wo?.status ?? '—',
    bg: '#f3f4f6',
    color: '#374151'
  }

  const consumptions = useMemo(() => wo?.consumptions ?? [], [wo?.consumptions])

  const dateRange = useMemo(() => {
    const startDate = wo?.actualStart
      ? new Date(wo.actualStart).toLocaleString('bg-BG')
      : wo?.plannedStart
        ? new Date(wo.plannedStart).toLocaleDateString('bg-BG')
        : '—'
    const endDate = wo?.actualEnd
      ? new Date(wo.actualEnd).toLocaleString('bg-BG')
      : wo?.plannedEnd
        ? new Date(wo.plannedEnd).toLocaleDateString('bg-BG')
        : '—'
    return `${startDate} / ${endDate}`
  }, [wo?.actualStart, wo?.actualEnd, wo?.plannedStart, wo?.plannedEnd])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/mes/orders" />
      <PageHeader
        title={`Нареждане ${wo?.orderNo ?? ''}`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {wo?.status === 'DRAFT' ? (
              <Button onClick={() => release.mutate(id)} disabled={release.isPending}>
                {release.isPending ? 'Пускане...' : 'Пусни'}
              </Button>
            ) : null}
            {wo?.status === 'RELEASED' ? (
              <Button onClick={() => start.mutate(id)} disabled={start.isPending}>
                {start.isPending ? 'Стартиране...' : 'Започни'}
              </Button>
            ) : null}
            {wo?.status === 'IN_PROGRESS' ? (
              <Button variant="success" onClick={() => complete.mutate(id)} disabled={complete.isPending}>
                {complete.isPending ? 'Завършване...' : 'Завърши'}
              </Button>
            ) : null}
          </div>
        }
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px 28px',
          marginTop: 4,
          marginBottom: 16,
          padding: '14px 16px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          fontSize: 14
        }}
      >
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Продукт: </span>
          <span>{wo?.product ? `${wo.product.code} — ${wo.product.name}` : '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Статус: </span>
          <StatusBadge label={status.label} bg={status.bg} color={status.color} />
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Планирано количество: </span>
          <span>
            {wo?.plannedQty != null
              ? `${wo.plannedQty}${wo?.product?.unit ? ` ${wo.product.unit}` : ''}`
              : '—'}
          </span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Начало / Край: </span>
          <span>{dateRange}</span>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #e5e7eb' }}>
          Консумации
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={thStyle}>Компонент</th>
              <th style={thStyle}>Планирано кол.</th>
              <th style={thStyle}>Изписано кол.</th>
              <th style={thStyle}>Локация</th>
            </tr>
          </thead>
          <tbody>
            {workOrderQuery.isLoading ? (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Зареждане...
                </td>
              </tr>
            ) : consumptions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма консумации — проверете дали продуктът има активна рецептура (BOM)
                </td>
              </tr>
            ) : (
              consumptions.map((c: any) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={tdStyle}>
                    {c.product ? `${c.product.code} — ${c.product.name}` : c.productId}
                  </td>
                  <td style={tdStyle}>{formatPlannedConsumption(c, wo)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    {formatQty(c.consumedQty ?? 0, c.product?.unit)}
                  </td>
                  <td style={tdStyle}>
                    {c.location ? `${c.location.code} — ${c.location.name}` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {wo?.status === 'COMPLETED' ? (
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            border: '1px solid #86efac',
            borderRadius: 10,
            background: '#f0fdf4',
            color: '#166534',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ✅ Произведено: {wo.producedQty}
          {wo?.product?.unit ? ` ${wo.product.unit}` : ' бр.'} → Локация:{' '}
          {wo.outputLocation ? `${wo.outputLocation.code} — ${wo.outputLocation.name}` : '—'}
        </div>
      ) : null}
    </div>
  )
}
