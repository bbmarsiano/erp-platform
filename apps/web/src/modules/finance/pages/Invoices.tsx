import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { api } from '../../../lib/api'
import { formatCurrency } from '../../../lib/currency'
import { useSuppliers } from '../../scm/hooks/useScm'
import {
  docTypeLabels,
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  invoiceStatusMap
} from '../financeUi'
import { useCreateInvoice, useCustomers, useInvoices } from '../hooks/useFinance'

type ProductOption = { id: string; code: string; name: string; price?: number | null }
type LineDraft = { productId: string; description: string; quantity: number; unitPrice: number; vatRate: number }

function calcTotals(lines: LineDraft[], headerVatRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const vatAmount = subtotal * (headerVatRate / 100)
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}

export default function Invoices() {
  const navigate = useNavigate()
  const [docTypeTab, setDocTypeTab] = useState<'INVOICE_OUT' | 'INVOICE_IN'>('INVOICE_OUT')
  const [statusFilter, setStatusFilter] = useState('')
  const invoices = useInvoices({ docType: docTypeTab, ...(statusFilter ? { status: statusFilter } : {}) })
  const customers = useCustomers()
  const suppliers = useSuppliers()
  const createInvoice = useCreateInvoice()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    customerId: '',
    supplierId: '',
    vatRate: 20,
    note: ''
  })
  const [lines, setLines] = useState<LineDraft[]>([])
  const [lineDraft, setLineDraft] = useState<LineDraft>({
    productId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 20
  })

  const productsQuery = useQuery({
    queryKey: ['wms', 'products'],
    queryFn: () => api.get('/api/wms/products').then((r) => r.data.data as ProductOption[])
  })
  const products = (productsQuery.data ?? []).filter((p: any) => p.isActive !== false)

  const rows = useMemo(() => (invoices.data ?? []) as Array<any>, [invoices.data])
  const totals = useMemo(() => calcTotals(lines, form.vatRate), [lines, form.vatRate])

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setLineDraft((prev) => ({
      ...prev,
      productId,
      description: product ? `${product.code} — ${product.name}` : '',
      unitPrice: product?.price != null ? Number(product.price) : 0
    }))
  }

  const addLine = () => {
    if (!lineDraft.description || !lineDraft.quantity) return
    setLines((prev) => [...prev, { ...lineDraft, vatRate: form.vatRate }])
    setLineDraft({ productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: form.vatRate })
  }

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const onCreate = async () => {
    if (lines.length === 0) return
    if (docTypeTab === 'INVOICE_OUT' && !form.customerId) return
    if (docTypeTab === 'INVOICE_IN' && !form.supplierId) return

    const created = await createInvoice.mutateAsync({
      docType: docTypeTab,
      issueDate: form.issueDate,
      dueDate: form.dueDate || undefined,
      customerId: docTypeTab === 'INVOICE_OUT' ? form.customerId : undefined,
      supplierId: docTypeTab === 'INVOICE_IN' ? form.supplierId : undefined,
      vatRate: form.vatRate,
      note: form.note || undefined,
      lines: lines.map((l) => ({
        productId: l.productId || undefined,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate
      }))
    })
    setShowForm(false)
    setLines([])
    setForm({ issueDate: new Date().toISOString().slice(0, 10), dueDate: '', customerId: '', supplierId: '', vatRate: 20, note: '' })
    navigate(`/finance/invoices/${created.id}`)
  }

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid',
    borderColor: active ? '#2563eb' : '#e5e7eb',
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#1d4ed8' : '#374151',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer'
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Фактури"
        subtitle="Изходящи и входящи фактури"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова фактура</Button> : undefined}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" style={tabStyle(docTypeTab === 'INVOICE_OUT')} onClick={() => setDocTypeTab('INVOICE_OUT')}>
          Изходящи
        </button>
        <button type="button" style={tabStyle(docTypeTab === 'INVOICE_IN')} onClick={() => setDocTypeTab('INVOICE_IN')}>
          Входящи
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Всички статуси</option>
            {Object.entries(invoiceStatusMap).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={4}>
            <FormField label="Дата на издаване" required>
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </FormField>
            <FormField label="Падеж">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </FormField>
            {docTypeTab === 'INVOICE_OUT' ? (
              <FormField label="Клиент" required>
                <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">Изберете клиент</option>
                  {((customers.data ?? []) as Array<any>).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField label="Доставчик" required>
                <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">Изберете доставчик</option>
                  {((suppliers.data ?? []) as Array<any>).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="ДДС %">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
              />
            </FormField>
          </FormRow>
          <FormField label="Бележка">
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="По избор" />
          </FormField>

          <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={financeTableThStyle}>Продукт</th>
                  <th style={financeTableThStyle}>Описание</th>
                  <th style={financeTableThStyle}>Кол.</th>
                  <th style={financeTableThStyle}>Цена</th>
                  <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Сума</th>
                  <th style={financeTableThStyle} />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx} style={financeTableRowStyle}>
                    <td style={financeTableTdStyle}>{l.productId ? '✓' : '—'}</td>
                    <td style={financeTableTdStyle}>{l.description}</td>
                    <td style={financeTableTdStyle}>{l.quantity}</td>
                    <td style={financeTableTdStyle}>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(l.quantity * l.unitPrice)}
                    </td>
                    <td style={financeTableTdStyle}>
                      <Button variant="secondary" size="sm" onClick={() => removeLine(idx)}>
                        Премахни
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Select value={lineDraft.productId} onChange={(e) => handleProductChange(e.target.value)}>
                      <option value="">Продукт (по избор)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Input
                      value={lineDraft.description}
                      onChange={(e) => setLineDraft({ ...lineDraft, description: e.target.value })}
                      placeholder="Описание"
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Input
                      type="number"
                      min={0.001}
                      step="0.001"
                      value={lineDraft.quantity}
                      onChange={(e) => setLineDraft({ ...lineDraft, quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={lineDraft.unitPrice}
                      onChange={(e) => setLineDraft({ ...lineDraft, unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle', textAlign: 'right' }}>
                    <Button onClick={addLine} disabled={!lineDraft.description || !lineDraft.quantity}>
                      Добави ред
                    </Button>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 16, fontSize: 14 }}>
            <div>
              <span style={{ color: '#6b7280' }}>Данъчна основа: </span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>ДДС: </span>
              <strong>{formatCurrency(totals.vatAmount)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Общо: </span>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createInvoice.isPending || lines.length === 0}>
              {createInvoice.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Номер</th>
              <th style={financeTableThStyle}>Тип</th>
              <th style={financeTableThStyle}>{docTypeTab === 'INVOICE_OUT' ? 'Клиент' : 'Доставчик'}</th>
              <th style={financeTableThStyle}>Дата</th>
              <th style={financeTableThStyle}>Статус</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Общо</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма фактури
                </td>
              </tr>
            ) : (
              rows.map((inv) => {
                const st = invoiceStatusMap[inv.status] ?? { label: inv.status, bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr
                    key={inv.id}
                    style={financeTableRowStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>{inv.number}</td>
                    <td style={financeTableTdStyle}>{docTypeLabels[inv.docType] ?? inv.docType}</td>
                    <td style={financeTableTdStyle}>
                      {inv.customer?.name ?? inv.supplier?.name ?? '—'}
                    </td>
                    <td style={financeTableTdStyle}>
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('bg-BG') : '—'}
                    </td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                    </td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td style={financeTableTdStyle}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/finance/invoices/${inv.id}`)}>
                        Преглед
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
