import { useCallback, useMemo, useState } from 'react'
import { Scan } from 'lucide-react'
import { BarcodeScanner, type ScanResult } from '../../../components/BarcodeScanner'
import { Button, PageHeader } from '../../../components/ui'
import { useStock } from '../../wms/hooks/useWms'
import { useCreateSale, useRegisters } from '../hooks/usePos'

type CartItem = {
  productId: string
  locationId: string
  name: string
  code: string
  unit: string
  available: number
  quantity: number
  unitPrice: number
}

export default function PosDashboard() {
  const stock = useStock()
  const registers = useRegisters()
  const createSale = useCreateSale()
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MIXED'>('CASH')
  const [registerId, setRegisterId] = useState('')
  const [lastSale, setLastSale] = useState<any>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const products = useMemo(
    () =>
      ((stock.data ?? []) as Array<any>)
        .filter((x) => x.quantity > 0 && x.location)
        .sort((a, b) => a.product.code.localeCompare(b.product.code)),
    [stock.data]
  )

  const addToCart = useCallback((row: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === row.product.id && c.locationId === row.location.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + 1, row.quantity) }
        return next
      }
      return [
        ...prev,
        {
          productId: row.product.id,
          locationId: row.location.id,
          name: row.product.name,
          code: row.product.code,
          unit: row.product.unit,
          available: row.quantity,
          quantity: 1,
          unitPrice: 1
        }
      ]
    })
  }, [])

  const handleProductScanned = useCallback(
    (product: ScanResult) => {
      setScannerOpen(false)
      const fromStockList = products.find((r) => r.product.id === product.id && r.quantity > 0)
      if (fromStockList) {
        addToCart(fromStockList)
        return
      }
      const stockItem = product.stockItems?.find((si) => si.quantity > 0 && si.location)
      if (stockItem?.location) {
        addToCart({
          id: stockItem.id,
          product: { id: product.id, name: product.name, code: product.code, unit: product.unit },
          location: stockItem.location,
          quantity: stockItem.quantity
        })
      }
    },
    [addToCart, products]
  )

  const total = cart.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0)

  const completeSale = async () => {
    if (!registerId || cart.length === 0) return
    const sale = await createSale.mutateAsync({
      cashRegisterId: registerId,
      paymentMethod,
      lines: cart.map((c) => ({ productId: c.productId, locationId: c.locationId, quantity: c.quantity, unitPrice: c.unitPrice }))
    })
    setLastSale(sale)
    setCart([])
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="POS терминал" subtitle="Терминал за продажби" />
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 14, marginTop: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Продукти</div>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
              }}
            >
              <Scan size={15} />
              Сканирай
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {products.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => addToCart(row)}
                style={{ textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', padding: 10, cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 700 }}>{row.product.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{row.product.code}</div>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Наличност: {row.quantity} {row.product.unit}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Текуща продажба</div>
          {cart.map((c, idx) => (
            <div key={`${c.productId}-${c.locationId}`} style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{c.name}</strong>
                <button type="button" onClick={() => setCart((p) => p.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#dc2626' }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <button type="button" onClick={() => setCart((p) => p.map((x, i) => (i === idx ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>
                  -
                </button>
                <span>{c.quantity}</span>
                <button type="button" onClick={() => setCart((p) => p.map((x, i) => (i === idx ? { ...x, quantity: Math.min(x.available, x.quantity + 1) } : x)))}>
                  +
                </button>
                <input
                  type="number"
                  value={c.unitPrice}
                  onChange={(e) => setCart((p) => p.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x)))}
                  style={{ width: 90 }}
                />
                <span>{(c.quantity * c.unitPrice).toFixed(2)} лв.</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 28, fontWeight: 900 }}>Общо: {total.toFixed(2)} лв.</div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} style={{ padding: 8 }}>
              <option value="CASH">Кеш</option>
              <option value="CARD">Карта</option>
              <option value="MIXED">Смесено</option>
            </select>
            <select value={registerId} onChange={(e) => setRegisterId(e.target.value)} style={{ padding: 8 }}>
              <option value="">Изберете каса</option>
              {((registers.data ?? []) as Array<any>).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </select>
            <Button variant="success" onClick={completeSale} disabled={createSale.isPending || !cart.length || !registerId}>
              Завърши продажба
            </Button>
          </div>

          {lastSale ? (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 10, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534' }}>
              ✅ Продажба {lastSale.saleNo} — {lastSale.totalAmount?.toFixed?.(2) ?? lastSale.totalAmount} лв.
              <div style={{ marginTop: 8 }}>
                <Button onClick={() => setLastSale(null)}>Нова продажба</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {scannerOpen && <BarcodeScanner title="POS Скенер" onProductFound={handleProductScanned} onClose={() => setScannerOpen(false)} />}
    </div>
  )
}
