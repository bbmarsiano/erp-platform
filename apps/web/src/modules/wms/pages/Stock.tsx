import { useMemo, useState } from 'react'
import { StockTable } from '../components/StockTable'
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
          <StockTable rows={rows} />
        )}
      </div>
    </div>
  )
}

