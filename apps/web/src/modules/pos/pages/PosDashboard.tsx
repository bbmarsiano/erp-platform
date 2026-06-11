import { useCallback, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Scan, Printer, Download, RotateCcw, CheckCircle } from 'lucide-react'
import { BarcodeScanner, type ScanResult } from '../../../components/BarcodeScanner'
import { Button, PageHeader } from '../../../components/ui'
import { api } from '../../../lib/api'
import { CURRENCY_CODE, CURRENCY_SYMBOL, formatCurrency } from '../../../lib/currency'
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

type TenantInfo = {
  name?: string
  logoUrl?: string
  address?: string
  eik?: string
  vatNumber?: string
  vatRegistered?: boolean
  mol?: string
  city?: string
  phone?: string
  bankName?: string
  bankIban?: string
}

type CompletedSale = {
  saleNo: string
  total: number
  paymentMethod: string
  registerName: string
  lines: { productName: string; quantity: number; unitPrice: number; total: number; vatRate?: number }[]
  createdAt: string
  issueInvoice: boolean
  invoiceNumber?: string
  tenant?: TenantInfo
}

const getInvoiceNumber = () => {
  const num = Number(localStorage.getItem('dflow_invoice_counter') || '0') + 1
  localStorage.setItem('dflow_invoice_counter', String(num))
  return `${new Date().getFullYear()}-${String(num).padStart(6, '0')}`
}

export default function PosDashboard() {
  const stock = useStock()
  const registers = useRegisters()
  const createSale = useCreateSale()
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MIXED'>('CASH')
  const [registerId, setRegisterId] = useState('')
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [issueInvoice, setIssueInvoice] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api.get('/api/tenant').then((r) => r.data.data as TenantInfo)
  })

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
    const t = completedSale.tenant
    const vatBase = t?.vatRegistered ? completedSale.total / 1.2 : completedSale.total
    const vatAmt = t?.vatRegistered ? completedSale.total - vatBase : 0
    const lines = [
      '================================',
      t?.name || '        КАСОВА БЕЛЕЖКА',
      t?.address ? `${t.address}${t.city ? `, ${t.city}` : ''}` : '',
      t?.eik ? `ЕИК: ${t.eik}` : '',
      t?.vatRegistered && t?.vatNumber ? `ДДС №: ${t.vatNumber}` : '',
      '================================',
      `Номер: ${completedSale.saleNo}`,
      `Дата:  ${new Date(completedSale.createdAt).toLocaleString('bg-BG')}`,
      `Каса:  ${completedSale.registerName}`,
      '--------------------------------',
      ...completedSale.lines.map(
        (l) => `${l.productName}\n  ${l.quantity} x ${formatCurrency(l.unitPrice)} = ${formatCurrency(l.total)}`
      ),
      '--------------------------------',
      ...(t?.vatRegistered
        ? [`Данъчна основа: ${formatCurrency(vatBase)}`, `ДДС 20%: ${formatCurrency(vatAmt)}`]
        : []),
      `ОБЩО: ${formatCurrency(completedSale.total)}`,
      `Плащане: ${completedSale.paymentMethod === 'CASH' ? 'В БРОЙ' : completedSale.paymentMethod === 'CARD' ? 'С КАРТА' : 'СМЕСЕНО'}`,
      '================================',
      '     Благодарим ви!',
      t?.mol ? `МОЛ: ${t.mol}` : '',
      'Документът е издаден съгласно ЗДДС и Наредба Н-18',
      '================================'
    ]
      .filter(Boolean)
      .join('\n')

    const blob = new Blob(['\uFEFF' + lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${completedSale.saleNo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadInvoice = () => {
    if (!completedSale?.invoiceNumber || !completedSale.tenant) return
    const t = completedSale.tenant
    const vatBase = t.vatRegistered ? completedSale.total / 1.2 : completedSale.total
    const vatAmt = t.vatRegistered ? completedSale.total - vatBase : 0

    const lines = [
      '================================================================',
      '                         Ф А К Т У Р А',
      '================================================================',
      `Фактура №:    ${completedSale.invoiceNumber}`,
      `Дата:         ${new Date(completedSale.createdAt).toLocaleDateString('bg-BG')}`,
      `Данъчна дата: ${new Date(completedSale.createdAt).toLocaleDateString('bg-BG')}`,
      '',
      '--- ДОСТАВЧИК ---',
      `Фирма:  ${t.name || ''}`,
      `ЕИК:    ${t.eik || ''}`,
      t.vatRegistered ? `ДДС №:  ${t.vatNumber || ''}` : '',
      `Адрес:  ${t.address || ''}, ${t.city || ''}`,
      t.mol ? `МОЛ:    ${t.mol}` : '',
      t.bankIban ? `IBAN:   ${t.bankIban}` : '',
      t.bankName ? `Банка:  ${t.bankName}` : '',
      '',
      '--- ПОЛУЧАТЕЛ ---',
      'Фирма:  [Получател]',
      'ЕИК:    [ЕИК на получателя]',
      'Адрес:  [Адрес на получателя]',
      '(Полетата ще се попълват автоматично след добавяне на модул Счетоводство)',
      '',
      '================================================================',
      'Артикул                        Кол.    Ед.цена    Стойност',
      '----------------------------------------------------------------',
      ...completedSale.lines.map(
        (l) =>
          `${l.productName.padEnd(30)} ${String(l.quantity).padStart(5)}  ${l.unitPrice.toFixed(2).padStart(9)}  ${l.total.toFixed(2).padStart(9)} ${CURRENCY_SYMBOL}`
      ),
      '----------------------------------------------------------------',
      ...(t.vatRegistered
        ? [
            `Данъчна основа (20%):              ${vatBase.toFixed(2).padStart(9)} ${CURRENCY_SYMBOL}`,
            `ДДС 20%:                           ${vatAmt.toFixed(2).padStart(9)} ${CURRENCY_SYMBOL}`
          ]
        : []),
      `ОБЩО:                              ${completedSale.total.toFixed(2).padStart(9)} ${CURRENCY_SYMBOL}`,
      `Валута: ${CURRENCY_CODE}`,
      '',
      `Начин на плащане: ${completedSale.paymentMethod === 'CASH' ? 'В БРОЙ' : 'С КАРТА'}`,
      '',
      '================================================================',
      'Съставил: _________________    Получател: _________________',
      '',
      'Документът е издаден съгласно ЗДДС',
      '================================================================'
    ].join('\n')

    const blob = new Blob(['\uFEFF' + lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${completedSale.invoiceNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const completeSale = async () => {
    if (!registerId || cart.length === 0) return
    const currentCart = [...cart]
    const currentRegisterId = registerId
    const currentPaymentMethod = paymentMethod
    const currentIssueInvoice = issueInvoice
    const currentTenant = tenant
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
      createdAt: new Date().toISOString(),
      issueInvoice: currentIssueInvoice,
      invoiceNumber: currentIssueInvoice ? getInvoiceNumber() : undefined,
      tenant: currentTenant
    })
    setCart([])
    setRegisterId('')
    setIssueInvoice(false)
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
                <span>{formatCurrency(c.quantity * c.unitPrice)}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 28, fontWeight: 900 }}>Общо: {formatCurrency(total)}</div>

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
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                cursor: 'pointer',
                fontSize: 13,
                color: '#374151'
              }}
            >
              <input
                type="checkbox"
                checked={issueInvoice}
                onChange={(e) => setIssueInvoice(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#7c3aed' }}
              />
              Издай фактура
            </label>
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
              {(() => {
                const t = completedSale.tenant
                return (
                  <>
                    <div
                      style={{
                        textAlign: 'center',
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: '1px dashed #e5e7eb'
                      }}
                    >
                      {t?.logoUrl && (
                        <img
                          src={t.logoUrl}
                          alt=""
                          style={{ maxHeight: 40, objectFit: 'contain', marginBottom: 8 }}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{t?.name || 'DFlowERP'}</div>
                      {t?.address && (
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {t.address}
                          {t?.city ? `, ${t.city}` : ''}
                        </div>
                      )}
                      {t?.eik && <div style={{ fontSize: 11, color: '#6b7280' }}>ЕИК: {t.eik}</div>}
                      {t?.vatRegistered && t?.vatNumber && (
                        <div style={{ fontSize: 11, color: '#6b7280' }}>ДДС №: {t.vatNumber}</div>
                      )}
                      {t?.phone && <div style={{ fontSize: 11, color: '#6b7280' }}>Тел: {t.phone}</div>}
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>КАСОВА БЕЛЕЖКА</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>№ {completedSale.saleNo}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {new Date(completedSale.createdAt).toLocaleString('bg-BG')}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Каса: {completedSale.registerName}</div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto auto',
                          gap: '4px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6b7280',
                          borderBottom: '1px solid #e5e7eb',
                          paddingBottom: 4,
                          marginBottom: 6
                        }}
                      >
                        <span>Артикул</span>
                        <span style={{ textAlign: 'right' }}>Кол.</span>
                        <span style={{ textAlign: 'right' }}>Ед.цена</span>
                        <span style={{ textAlign: 'right' }}>Стойност</span>
                      </div>
                      {completedSale.lines.map((line, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto',
                            gap: '2px 8px',
                            fontSize: 12,
                            marginBottom: 4
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{line.productName}</span>
                          <span style={{ textAlign: 'right', color: '#6b7280' }}>{line.quantity}</span>
                          <span style={{ textAlign: 'right', color: '#6b7280' }}>{line.unitPrice.toFixed(2)}</span>
                          <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(line.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginBottom: 10 }}>
                      {t?.vatRegistered && (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: '#6b7280',
                              marginBottom: 2
                            }}
                          >
                            <span>Данъчна основа (20% ДДС):</span>
                            <span>{formatCurrency(completedSale.total / 1.2)}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: '#6b7280',
                              marginBottom: 6
                            }}
                          >
                            <span>ДДС 20%:</span>
                            <span>{formatCurrency(completedSale.total - completedSale.total / 1.2)}</span>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>ОБЩО:</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(completedSale.total)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        Начин на плащане:{' '}
                        {completedSale.paymentMethod === 'CASH'
                          ? 'В БРОЙ'
                          : completedSale.paymentMethod === 'CARD'
                            ? 'С КАРТА'
                            : 'СМЕСЕНО'}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        paddingTop: 10,
                        borderTop: '1px dashed #e5e7eb',
                        fontSize: 10,
                        color: '#9ca3af'
                      }}
                    >
                      <div>Благодарим ви!</div>
                      {t?.mol && <div>МОЛ: {t.mol}</div>}
                      <div style={{ marginTop: 4 }}>Документът е издаден съгласно ЗДДС и Наредба Н-18</div>
                    </div>
                  </>
                )
              })()}
            </div>

            {completedSale.issueInvoice && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  📄 Фактура № {completedSale.invoiceNumber}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  Свали фактура № {completedSale.invoiceNumber}
                </button>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
                  Получателят ще може да се избира след добавяне на модул Счетоводство
                </div>
              </div>
            )}

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
