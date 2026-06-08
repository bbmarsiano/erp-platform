import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Scan } from 'lucide-react'
import { BarcodeScanner, type ScanResult } from '../../../components/BarcodeScanner'
import { PageHeader, StatusBadge } from '../../../components/ui'
import { api } from '../../../lib/api'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useStock } from '../hooks/useWms'

export default function Stock() {
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [highlightProductId, setHighlightProductId] = useState<string | null>(null)
  const [editingBarcode, setEditingBarcode] = useState<{ id: string; value: string } | null>(null)
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useStock(warehouseId || undefined)

  const rows = useMemo(() => (data ?? []) as any[], [data])

  const handleProductFound = (product: ScanResult) => {
    setScannerOpen(false)
    setHighlightProductId(product.id)
    const el = rowRefs.current[product.id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setTimeout(() => setHighlightProductId(null), 3000)
  }

  const saveBarcode = async (productId: string, barcode: string) => {
    await api.put(`/api/wms/products/${productId}/barcode`, { barcode })
    await queryClient.invalidateQueries({ queryKey: ['wms', 'stock'] })
    setEditingBarcode(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Наличности"
        subtitle="Текущи наличности по продукт и локация"
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <Scan size={14} />
              Сканирай и търси
            </button>
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
                  <th style={{ width: '18%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Артикул
                  </th>
                  <th style={{ width: '12%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Код
                  </th>
                  <th style={{ width: '14%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Баркод
                  </th>
                  <th style={{ width: '22%', padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Локация
                  </th>
                  <th style={{ width: '12%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Количество
                  </th>
                  <th style={{ width: '8%', padding: '11px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Мин.</th>
                  <th style={{ width: '14%', padding: '11px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item: any) => {
                  const isLow = item.quantity < item.product?.minStock
                  const isEmpty = item.quantity === 0
                  const productId = item.product?.id
                  const isHighlighted = highlightProductId === productId
                  return (
                    <tr
                      key={item.id}
                      ref={(el) => {
                        if (productId) rowRefs.current[productId] = el
                      }}
                      style={{
                        background: isHighlighted ? '#ede9fe' : isEmpty ? '#fff1f2' : isLow ? '#fff7ed' : 'white',
                        borderBottom: '1px solid #f3f4f6',
                        outline: isHighlighted ? '2px solid #7c3aed' : undefined,
                        transition: 'background 0.3s'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{item.product?.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{item.product?.code}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingBarcode && editingBarcode.id === productId ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input
                              value={editingBarcode.value}
                              onChange={(e) => setEditingBarcode({ id: productId, value: e.target.value })}
                              style={{
                                padding: '4px 8px',
                                border: '1.5px solid #7c3aed',
                                borderRadius: 6,
                                fontSize: 12,
                                width: 120,
                                outline: 'none'
                              }}
                              autoFocus
                              onKeyDown={async (e) => {
                                const draft = editingBarcode
                                if (e.key === 'Enter' && draft) {
                                  await saveBarcode(productId, draft.value)
                                }
                                if (e.key === 'Escape') setEditingBarcode(null)
                              }}
                            />
                            <button type="button" onClick={() => setEditingBarcode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setEditingBarcode({ id: productId, value: item.product?.barcode || '' })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingBarcode({ id: productId, value: item.product?.barcode || '' })
                            }}
                            style={{
                              cursor: 'pointer',
                              fontSize: 12,
                              color: item.product?.barcode ? '#0f172a' : '#9ca3af',
                              fontFamily: item.product?.barcode ? 'monospace' : 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Scan size={11} color={item.product?.barcode ? '#7c3aed' : '#d1d5db'} />
                            {item.product?.barcode || 'Задай баркод'}
                          </div>
                        )}
                      </td>
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

      {scannerOpen && (
        <BarcodeScanner title="Търсене по баркод" onProductFound={handleProductFound} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  )
}
