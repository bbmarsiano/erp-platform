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

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 12, color: '#6b7280' }}>Зареждане...</div>
        ) : error ? (
          <div style={{ padding: 12, color: '#991b1b' }}>Грешка при зареждане на наличности</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 12, color: '#6b7280' }}>Няма наличности</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 12px' }}>Артикул</th>
                <th style={{ padding: '10px 12px' }}>Код</th>
                <th style={{ padding: '10px 12px' }}>Локация</th>
                <th style={{ padding: '10px 12px' }}>Склад</th>
                <th style={{ padding: '10px 12px' }}>Количество</th>
                <th style={{ padding: '10px 12px' }}>Мин. количество</th>
                <th style={{ padding: '10px 12px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    background: item.quantity < item.product.minStock ? '#fff7ed' : 'white',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>{item.product.name}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{item.product.code}</td>
                  <td style={{ padding: '10px 12px' }}>{item.location.code}</td>
                  <td style={{ padding: '10px 12px' }}>{item.location.warehouse.name}</td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontWeight: item.quantity < item.product.minStock ? 700 : 400,
                      color: item.quantity < item.product.minStock ? '#dc2626' : 'inherit'
                    }}
                  >
                    {item.quantity} {item.product?.unit}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{item.product.minStock}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {item.quantity === 0 ? (
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}
                      >
                        Изчерпан
                      </span>
                    ) : item.quantity < item.product.minStock ? (
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: '#fff7ed',
                          color: '#c2410c',
                          border: '1px solid #fed7aa'
                        }}
                      >
                        ⚠️ Под минимум
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: '#dcfce7',
                          color: '#166534'
                        }}
                      >
                        Нормално
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

