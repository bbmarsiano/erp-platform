import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { api } from '../../../lib/api'
import { formatCurrency } from '../../../lib/currency'
import { useToastStore } from '../../../store/toast.store'
import { useSuppliers } from '../../scm/hooks/useScm'
import {
  docTypeLabels,
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  invoiceStatusMap
} from '../financeUi'
import { useCreateInvoice, useCustomers, useImportInvoice, useInvoices } from '../hooks/useFinance'

type ProductOption = { id: string; code: string; name: string; price?: number | null }
type LineDraft = { productId: string; description: string; quantity: number; unitPrice: number; vatRate: number }
type ImportStatus = 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'

const emptyLineDraft = (vatRate = 20): LineDraft => ({
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  vatRate
})

function calcTotals(lines: LineDraft[], headerVatRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const vatAmount = subtotal * (headerVatRate / 100)
  return { subtotal, vatAmount, total: subtotal + vatAmount }
}

function mapImportError(err: unknown): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!data) return 'Грешка при импорт на фактура'
  const code = data.code as string | undefined
  if (code === 'CUSTOMER_REQUIRED' || code === 'SUPPLIER_REQUIRED') {
    return 'Изберете клиент/доставчик.'
  }
  if (code === 'AMOUNT_PAID_INVALID') {
    return 'Платената сума трябва да е по-малка от общата сума.'
  }
  if (code === 'DUPLICATE_INVOICE_NUMBER' && typeof data.error === 'string') {
    return data.error
  }
  const fieldErrors = (data.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors
  if (fieldErrors) {
    const entry = Object.entries(fieldErrors).find(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
    if (entry) return `${entry[0]}: ${entry[1][0]}`
  }
  if (typeof data.error === 'string') return data.error
  return 'Грешка при импорт на фактура'
}

export default function Invoices() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [docTypeTab, setDocTypeTab] = useState<'INVOICE_OUT' | 'INVOICE_IN'>('INVOICE_OUT')
  const [statusFilter, setStatusFilter] = useState('')
  const invoices = useInvoices({ docType: docTypeTab, ...(statusFilter ? { status: statusFilter } : {}) })
  const customers = useCustomers()
  const suppliers = useSuppliers()
  const createInvoice = useCreateInvoice()
  const importInvoice = useImportInvoice()

  const [showForm, setShowForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [form, setForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    customerId: '',
    supplierId: '',
    vatRate: 20,
    note: ''
  })
  const [lines, setLines] = useState<LineDraft[]>([])
  const [lineDraft, setLineDraft] = useState<LineDraft>(emptyLineDraft())

  const [importForm, setImportForm] = useState({
    number: '',
    issueDate: '',
    dueDate: '',
    customerId: '',
    supplierId: '',
    status: 'ISSUED' as ImportStatus,
    amountPaid: '',
    currency: 'BGN',
    vatRate: 20,
    note: ''
  })
  const [importLines, setImportLines] = useState<LineDraft[]>([])
  const [importLineDraft, setImportLineDraft] = useState<LineDraft>(emptyLineDraft())
  const [importError, setImportError] = useState('')

  const productsQuery = useQuery({
    queryKey: ['wms', 'products'],
    queryFn: () => api.get('/api/wms/products').then((r) => r.data.data as ProductOption[])
  })
  const products = (productsQuery.data ?? []).filter((p: any) => p.isActive !== false)

  const rows = useMemo(() => (invoices.data ?? []) as Array<any>, [invoices.data])
  const totals = useMemo(() => calcTotals(lines, form.vatRate), [lines, form.vatRate])
  const importTotals = useMemo(
    () => calcTotals(importLines, importForm.vatRate),
    [importLines, importForm.vatRate]
  )

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setLineDraft((prev) => ({
      ...prev,
      productId,
      description: product ? `${product.code} — ${product.name}` : '',
      unitPrice: product?.price != null ? Number(product.price) : 0
    }))
  }

  const handleImportProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setImportLineDraft((prev) => ({
      ...prev,
      productId,
      description: product ? `${product.code} — ${product.name}` : '',
      unitPrice: product?.price != null ? Number(product.price) : 0
    }))
  }

  const addLine = () => {
    if (!lineDraft.description || !lineDraft.quantity) return
    setLines((prev) => [...prev, { ...lineDraft, vatRate: form.vatRate }])
    setLineDraft(emptyLineDraft(form.vatRate))
  }

  const addImportLine = () => {
    if (!importLineDraft.description || !importLineDraft.quantity) return
    setImportLines((prev) => [...prev, { ...importLineDraft, vatRate: importForm.vatRate }])
    setImportLineDraft(emptyLineDraft(importForm.vatRate))
  }

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))
  const removeImportLine = (idx: number) => setImportLines((prev) => prev.filter((_, i) => i !== idx))

  const resetImportForm = () => {
    setImportForm({
      number: '',
      issueDate: '',
      dueDate: '',
      customerId: '',
      supplierId: '',
      status: 'ISSUED',
      amountPaid: '',
      currency: 'BGN',
      vatRate: 20,
      note: ''
    })
    setImportLines([])
    setImportLineDraft(emptyLineDraft())
    setImportError('')
    setShowImportForm(false)
  }

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

  const onImport = async () => {
    setImportError('')
    if (!importForm.number.trim()) {
      setImportError('Номерът на фактурата е задължителен.')
      return
    }
    if (!importForm.issueDate) {
      setImportError('Датата на издаване е задължителна.')
      return
    }
    if (importLines.length === 0) {
      setImportError('Добавете поне един ред.')
      return
    }
    if (docTypeTab === 'INVOICE_OUT' && !importForm.customerId) {
      setImportError('Изберете клиент/доставчик.')
      return
    }
    if (docTypeTab === 'INVOICE_IN' && !importForm.supplierId) {
      setImportError('Изберете клиент/доставчик.')
      return
    }

    let amountPaid: number | undefined
    if (importForm.status === 'PARTIALLY_PAID') {
      amountPaid = Number(importForm.amountPaid)
      if (!importForm.amountPaid || Number.isNaN(amountPaid) || amountPaid < 0) {
        setImportError('Въведете платена сума.')
        return
      }
      if (!(amountPaid < importTotals.total)) {
        setImportError('Платената сума трябва да е по-малка от общата сума.')
        return
      }
    }

    try {
      await importInvoice.mutateAsync({
        docType: docTypeTab,
        number: importForm.number.trim(),
        issueDate: importForm.issueDate,
        dueDate: importForm.dueDate || undefined,
        customerId: docTypeTab === 'INVOICE_OUT' ? importForm.customerId : undefined,
        supplierId: docTypeTab === 'INVOICE_IN' ? importForm.supplierId : undefined,
        currency: importForm.currency || 'BGN',
        vatRate: importForm.vatRate,
        note: importForm.note || undefined,
        status: importForm.status,
        amountPaid,
        lines: importLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate
        }))
      })
      resetImportForm()
      showToast('Фактурата е импортирана успешно.', 'success')
    } catch (err) {
      setImportError(mapImportError(err))
    }
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

  const noFormsOpen = !showForm && !showImportForm

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Фактури"
        subtitle="Изходящи и входящи фактури"
        action={
          noFormsOpen ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowImportForm(true)
                  setShowForm(false)
                  setImportError('')
                }}
              >
                Импортирай фактура
              </Button>
              <Button
                onClick={() => {
                  setShowForm(true)
                  setShowImportForm(false)
                }}
              >
                Нова фактура
              </Button>
            </div>
          ) : undefined
        }
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

      {showImportForm ? (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Импорт на историческа фактура
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>
            Ръчно въвеждане с номер и краен статус. Не генерира автоматична номерация.
          </p>

          <FormRow columns={4}>
            <FormField label="Номер на фактура" required>
              <Input
                value={importForm.number}
                onChange={(e) => setImportForm({ ...importForm, number: e.target.value })}
                placeholder="0000000999"
              />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Ръчен номер, не се генерира автоматично.
              </div>
            </FormField>
            <FormField label="Дата на издаване" required>
              <Input
                type="date"
                value={importForm.issueDate}
                onChange={(e) => setImportForm({ ...importForm, issueDate: e.target.value })}
              />
            </FormField>
            <FormField label="Падеж">
              <Input
                type="date"
                value={importForm.dueDate}
                onChange={(e) => setImportForm({ ...importForm, dueDate: e.target.value })}
              />
            </FormField>
            {docTypeTab === 'INVOICE_OUT' ? (
              <FormField label="Клиент" required>
                <Select
                  value={importForm.customerId}
                  onChange={(e) => setImportForm({ ...importForm, customerId: e.target.value })}
                >
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
                <Select
                  value={importForm.supplierId}
                  onChange={(e) => setImportForm({ ...importForm, supplierId: e.target.value })}
                >
                  <option value="">Изберете доставчик</option>
                  {((suppliers.data ?? []) as Array<any>).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </FormRow>

          <FormRow columns={4}>
            <FormField label="Статус" required>
              <Select
                value={importForm.status}
                onChange={(e) =>
                  setImportForm({
                    ...importForm,
                    status: e.target.value as ImportStatus,
                    amountPaid: e.target.value === 'PARTIALLY_PAID' ? importForm.amountPaid : ''
                  })
                }
              >
                <option value="ISSUED">Издадена</option>
                <option value="PARTIALLY_PAID">Частично платена</option>
                <option value="PAID">Платена</option>
                <option value="CANCELLED">Анулирана</option>
              </Select>
            </FormField>
            {importForm.status === 'PARTIALLY_PAID' ? (
              <FormField label="Платена сума" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={importForm.amountPaid}
                  onChange={(e) => setImportForm({ ...importForm, amountPaid: e.target.value })}
                  placeholder="0.00"
                />
              </FormField>
            ) : (
              <div />
            )}
            <FormField label="Валута">
              <Input
                value={importForm.currency}
                onChange={(e) => setImportForm({ ...importForm, currency: e.target.value.toUpperCase() })}
              />
            </FormField>
            <FormField label="ДДС %">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={importForm.vatRate}
                onChange={(e) => setImportForm({ ...importForm, vatRate: Number(e.target.value) })}
              />
            </FormField>
          </FormRow>

          <FormField label="Бележка">
            <Input
              value={importForm.note}
              onChange={(e) => setImportForm({ ...importForm, note: e.target.value })}
              placeholder="По избор"
            />
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
                {importLines.map((l, idx) => (
                  <tr key={idx} style={financeTableRowStyle}>
                    <td style={financeTableTdStyle}>{l.productId ? '✓' : '—'}</td>
                    <td style={financeTableTdStyle}>{l.description}</td>
                    <td style={financeTableTdStyle}>{l.quantity}</td>
                    <td style={financeTableTdStyle}>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(l.quantity * l.unitPrice)}
                    </td>
                    <td style={financeTableTdStyle}>
                      <Button variant="secondary" size="sm" onClick={() => removeImportLine(idx)}>
                        Премахни
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Select
                      value={importLineDraft.productId}
                      onChange={(e) => handleImportProductChange(e.target.value)}
                    >
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
                      value={importLineDraft.description}
                      onChange={(e) => setImportLineDraft({ ...importLineDraft, description: e.target.value })}
                      placeholder="Описание"
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Input
                      type="number"
                      min={0.001}
                      step="0.001"
                      value={importLineDraft.quantity}
                      onChange={(e) =>
                        setImportLineDraft({ ...importLineDraft, quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle' }}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={importLineDraft.unitPrice}
                      onChange={(e) =>
                        setImportLineDraft({ ...importLineDraft, unitPrice: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td style={{ ...financeTableTdStyle, verticalAlign: 'middle', textAlign: 'right' }}>
                    <Button
                      onClick={addImportLine}
                      disabled={!importLineDraft.description || !importLineDraft.quantity}
                    >
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
              <strong>{formatCurrency(importTotals.subtotal)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>ДДС: </span>
              <strong>{formatCurrency(importTotals.vatAmount)}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Общо: </span>
              <strong>{formatCurrency(importTotals.total)}</strong>
            </div>
          </div>

          {importError ? (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#b91c1c',
                fontSize: 13
              }}
            >
              {importError}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" onClick={resetImportForm}>
              Отказ
            </Button>
            <Button onClick={() => void onImport()} disabled={importInvoice.isPending || importLines.length === 0}>
              {importInvoice.isPending ? 'Импорт...' : 'Импортирай'}
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
                    <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {inv.number}
                        {inv.source === 'IMPORT' ? (
                          <span
                            style={{
                              padding: '1px 8px',
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#92400e',
                              letterSpacing: '0.02em'
                            }}
                          >
                            Импорт
                          </span>
                        ) : null}
                      </span>
                    </td>
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
