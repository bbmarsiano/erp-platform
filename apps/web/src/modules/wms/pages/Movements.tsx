import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../components/ui'
import { api } from '../../../lib/api'

interface Movement {
  id: string
  movementType: string
  quantity: number
  productId: string
  fromLocationId?: string | null
  toLocationId?: string | null
  referenceType?: string | null
  createdAt: string
  product?: { name: string; code: string; unit: string }
  fromLocation?: { code: string }
  toLocation?: { code: string }
}

export default function Movements() {
  const { data, isLoading } = useQuery({
    queryKey: ['wms', 'movements'],
    queryFn: () => api.get('/api/wms/stock/movements').then((r) => r.data.data as Movement[])
  })

  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    IN: { label: 'Вход', color: '#166534', bg: '#dcfce7' },
    OUT: { label: 'Изход', color: '#991b1b', bg: '#fee2e2' },
    TRANSFER: { label: 'Трансфер', color: '#1e40af', bg: '#dbeafe' },
    ADJUSTMENT: { label: 'Корекция', color: '#854d0e', bg: '#fef9c3' }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Движения" subtitle="История на всички складови движения" />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Зареждане...</div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Тип', 'Артикул', 'Количество', 'От локация', 'До локация', 'Референция', 'Дата'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6b7280'
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!data?.length ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}
                  >
                    Няма записани движения
                  </td>
                </tr>
              ) : (
                data.map((m) => {
                  const t = typeLabels[m.movementType] || {
                    label: m.movementType,
                    color: '#374151',
                    bg: '#f3f4f6'
                  }
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: t.bg,
                            color: t.color
                          }}
                        >
                          {t.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                        {m.product?.name || m.productId}
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.product?.code}</div>
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: m.movementType === 'IN' ? '#059669' : '#dc2626'
                        }}
                      >
                        {m.movementType === 'IN' ? '+' : '-'}
                        {m.quantity} {m.product?.unit}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                        {m.fromLocationId ? m.fromLocation?.code || '—' : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                        {m.toLocationId ? m.toLocation?.code || '—' : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
                        {m.referenceType && <span>{m.referenceType}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
                        {new Date(m.createdAt).toLocaleDateString('bg-BG')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
