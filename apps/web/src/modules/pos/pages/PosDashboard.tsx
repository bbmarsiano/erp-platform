import { useCallback, useMemo, useRef, useState } from 'react'
import { Scan, Printer, Download, RotateCcw, CheckCircle } from 'lucide-react'
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

type CompletedSale = {
  saleNo: string
  total: number
  paymentMethod: string
  registerName: string
  lines: { productName: string; quantity: number; unitPrice: number; total: number }[]
  createdAt: string
}

export default function PosDashboard() {
  const stock = useStock()
  const registers = useRegisters()
  const createSale = useCreateSale()
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MIXED'>('CASH')
  const [registerId, setRegisterId] = useState('')
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

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

      const stockRow = products.find((r) => r.product.id === product.id && r.quantity > 0)
      const stockItem = product.stockItems?.find((si) => si.quantity > 0 && si.location)
      const locationId = stockRow?.location?.id ?? stockItem?.location?.id ?? stockItem?.locationId
      if (!locationId) return

      const available = stockRow?.quantity ?? stockItem?.quantity ?? product.totalStock ?? 0
      const unitPrice = product.price ?? 1

      setCart((prev) => {
        const idx = prev.findIndex((c) => c.productId === product.id && c.locationId === locationId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = {
            ...next[idx],
            quantity: Math.min(next[idx].quantity + 1, next[idx].available || available || 999)
          }
          return next
        }
        return [
          ...prev,
          {
            productId: product.id,
            locationId,
            name: product.name,
            code: product.code,
            unit: product.unit,
            available: available || 999,
            quantity: 1,
            unitPrice
          }
        ]
      })
    },
    [products]
  )

  const total = cart.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow || !receiptRef.current) return
    printWindow.document.write(`
    <html>
    <head>
      <title>Касова бележка ${completedSale?.saleNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px;
               width: 80mm; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total { font-size: 16px; font-weight: bold; margin: 8px 0; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      ${receiptRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body>
    </html>
  `)
    printWindow.document.close()
  }

  const handleDownload = () => {
    if (!completedSale) return
    const lines = [
      '================================',
      '        КАСОВА БЕЛЕЖКА',
      '================================',
      `Номер: ${completedSale.saleNo}`,
      `Дата:  ${new Date(completedSale.createdAt).toLocaleString('bg-BG')}`,
      `Каса:  ${completedSale.registerName}`,
      '--------------------------------',
      ...completedSale.lines.map(
        (l) => `${l.productName}\n  ${l.quantity} x ${l.unitPrice.toFixed(2)} = ${l.total.toFixed(2)} лв.`
      ),
      '--------------------------------',
      `ОБЩО: ${completedSale.total.toFixed(2)} лв.`,
      `Плащане: ${completedSale.paymentMethod === 'CASH' ? 'КЕШ' : completedSale.paymentMethod === 'CARD' ? 'КАРТА' : 'СМЕСЕНО'}`,
      '================================',
      '     Благодарим ви!',
      '================================'
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${completedSale.saleNo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completeSale = async () => {
    if (!registerId || cart.length === 0) return
    const currentCart = [...cart]
    const currentRegisterId = registerId
    const currentPaymentMethod = paymentMethod
    const sale = await createSale.mutateAsync({
      cashRegisterId: registerId,
      paymentMethod,
      lines: cart.map((c) => ({
        productId: c.productId,
        locationId: c.locationId,
        quantity: c.quantity,
        unitPrice: c.unitPrice
      }))
    })
    const registerList = (registers.data ?? []) as Array<{ id: string; name: string }>
    setCompletedSale({
      saleNo: sale.saleNo || sale.id,
      total: Number(sale.totalAmount),
      paymentMethod: currentPaymentMethod,
      registerName: registerList.find((r) => r.id === currentRegisterId)?.name || '',
      lines: currentCart.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      createdAt: new Date().toISOString()
    })
    setCart([])
    setRegisterId('')
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

        </div>
      </div>

      {completedSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <CheckCircle size={28} color="white" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Продажбата е завършена!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{completedSale.saleNo}</div>
              </div>
            </div>

            <div ref={receiptRef} style={{ padding: '20px 24px' }}>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: '1px dashed #e5e7eb'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>КАСОВА БЕЛЕЖКА</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {new Date(completedSale.createdAt).toLocaleString('bg-BG')}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Каса: {completedSale.registerName}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                {completedSale.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{line.productName}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {line.quantity} × {line.unitPrice.toFixed(2)} лв.
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginLeft: 12 }}>{line.total.toFixed(2)} лв.</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid #0f172a', paddingTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>ОБЩО</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>
                    {completedSale.total.toFixed(2)} лв.
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Метод:{' '}
                  {completedSale.paymentMethod === 'CASH'
                    ? '💵 Кеш'
                    : completedSale.paymentMethod === 'CARD'
                      ? '💳 Карта'
                      : 'Смесено'}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  paddingTop: 12,
                  borderTop: '1px dashed #e5e7eb',
                  fontSize: 12,
                  color: '#9ca3af'
                }}
              >
                Благодарим ви!
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                Принтирай
              </button>
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  background: 'white',
                  color: '#374151',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={15} />
                Свали
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  background: '#f0fdf4',
                  color: '#059669',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                Нова продажба
              </button>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && <BarcodeScanner title="POS Скенер" onProductFound={handleProductScanned} onClose={() => setScannerOpen(false)} />}
    </div>
  )
}
