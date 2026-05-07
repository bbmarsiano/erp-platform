import { useMemo, useState } from 'react'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useStock } from '../hooks/useWms'

export default function Stock() {
  const [warehouseId, setWarehouseId] = useState<string>('')
  const { data, isLoading, error } = useStock(warehouseId || undefined)

  const rows = useMemo(() => (data ?? []) as any[], [data])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Наличности</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>Текущи наличности по продукт и локация</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Филтър по склад</span>
          <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Всички складове" />
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
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
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ width: '22%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Артикул
                  </th>
                  <th style={{ width: '14%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Код
                  </th>
                  <th style={{ width: '28%', padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Локация
                  </th>
                  <th style={{ width: '14%', padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Количество
                  </th>
                  <th style={{ width: '10%', padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Мин.</th>
                  <th style={{ width: '12%', padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
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
                      <td style={{ padding: '12px', fontSize: 14, fontWeight: 500 }}>{item.product?.name}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{item.product?.code}</td>
                      <td style={{ padding: '12px', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.location?.code} — {item.location?.warehouse?.name}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontSize: 14,
                          fontWeight: isLow ? 700 : 400,
                          color: isEmpty ? '#dc2626' : isLow ? '#c2410c' : '#111'
                        }}
                      >
                        {item.quantity} {item.product?.unit}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                        {item.product?.minStock} {item.product?.unit}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isEmpty ? (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fca5a5'
                            }}
                          >
                            Изчерпан
                          </span>
                        ) : isLow ? (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#fff7ed',
                              color: '#c2410c',
                              border: '1px solid #fdba74'
                            }}
                          >
                            ⚠️ Под минимум
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#dcfce7',
                              color: '#166534',
                              border: '1px solid #86efac'
                            }}
                          >
                            ✓ Нормално
                          </span>
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

