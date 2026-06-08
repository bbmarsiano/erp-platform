import { useMemo, useState } from 'react'
import { PageHeader, StatusBadge } from '../../../components/ui'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useStock } from '../hooks/useWms'

export default function Stock() {
  const [warehouseId, setWarehouseId] = useState<string>('')
  const { data, isLoading, error } = useStock(warehouseId || undefined)

  const rows = useMemo(() => (data ?? []) as any[], [data])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Наличности"
        subtitle="Текущи наличности по продукт и локация"
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Филтър по склад</span>
            <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Всички складове" />
          </div>
        }
      />

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        {isLoading ? (
          <div style={{ padding: 12, color: '#6b7280' }}>Зареждане...</div>
        ) : error ? (
          <div style={{ padding: 12, color: '#991b1b' }}>Грешка при зареждане на наличности</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 12, color: '#6b7280' }}>Няма наличности</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ width: '22%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Артикул
                  </th>
                  <th style={{ width: '14%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Код
                  </th>
                  <th style={{ width: '28%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Локация
                  </th>
                  <th style={{ width: '14%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Количество
                  </th>
                  <th style={{ width: '10%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Мин.</th>
                  <th style={{ width: '12%', padding: '11px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item: any) => {
                  const isLow = item.quantity < item.product?.minStock
                  const isEmpty = item.quantity === 0
                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: isEmpty ? '#fff1f2' : isLow ? '#fff7ed' : 'white',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{item.product?.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{item.product?.code}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: item.location ? 'inherit' : '#9ca3af' }}>
                        {item.location ? `${item.location.code} — ${item.location.warehouse?.name}` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontSize: 13,
                          fontWeight: isLow ? 700 : 400,
                          color: isEmpty ? '#dc2626' : isLow ? '#c2410c' : '#111'
                        }}
                      >
                        {item.quantity} {item.product?.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                        {item.product?.minStock} {item.product?.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isEmpty ? (
                          <StatusBadge label="Изчерпан" bg="#fee2e2" color="#991b1b" />
                        ) : isLow ? (
                          <StatusBadge label="⚠️ Под минимум" bg="#fff7ed" color="#c2410c" />
                        ) : (
                          <StatusBadge label="✓ Нормално" bg="#dcfce7" color="#166534" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
