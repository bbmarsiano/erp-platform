import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Scan, Edit2, ToggleLeft, ToggleRight, Search, X } from 'lucide-react'
import { api } from '../../../lib/api'
import { BarcodeScanner } from '../../../components/BarcodeScanner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useWarehouses } from '../hooks/useWms'

interface Product {
  id: string
  code: string
  name: string
  unit: string
  barcode: string | null
  minStock: number
  price: number | null
  description: string | null
  isActive: boolean
  createdAt: string
  stockItems: { quantity: number }[]
}

const UNITS = ['бр.', 'кг.', 'г.', 'л.', 'мл.', 'м.', 'см.', 'м²', 'м³', 'пак.', 'кут.']

const emptyForm = {
  code: '',
  name: '',
  unit: 'бр.',
  barcode: '',
  minStock: 0,
  price: '',
  description: '',
  initialStock: 0,
  stockAdjustment: 0,
  warehouseId: ''
}

export default function Products() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerTarget, setScannerTarget] = useState<'form' | 'search'>('search')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['wms', 'products'],
    queryFn: () => api.get('/api/wms/products').then((r) => r.data.data as Product[])
  })

  const { data: warehouses = [] } = useWarehouses()

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search)
  )

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      api.post('/api/wms/products', {
        code: data.code,
        name: data.name,
        unit: data.unit,
        barcode: data.barcode || null,
        minStock: Number(data.minStock),
        price: data.price ? Number(data.price) : null,
        description: data.description || null,
        initialStock: Number(data.initialStock),
        warehouseId: data.warehouseId || null
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'products'] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
      setShowForm(false)
      setForm(emptyForm)
      setFormError('')
    },
    onError: (err: any) => setFormError(err?.response?.data?.error ?? 'Грешка')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/wms/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'products'] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
      setEditingProduct(null)
      setForm(emptyForm)
      setFormError('')
      setShowForm(false)
    },
    onError: (err: any) => setFormError(err?.response?.data?.error ?? 'Грешка')
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? api.delete(`/api/wms/products/${id}`) : api.put(`/api/wms/products/${id}`, { isActive: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'products'] }),
    onError: (err: any) => alert(err?.response?.data?.error ?? 'Грешка')
  })

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      code: product.code,
      name: product.name,
      unit: product.unit,
      barcode: product.barcode || '',
      minStock: product.minStock,
      price: product.price?.toString() || '',
      description: product.description || '',
      initialStock: 0,
      stockAdjustment: 0,
      warehouseId: ''
    })
    setShowForm(true)
    setFormError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleSubmit = () => {
    if (!form.code.trim() || !form.name.trim() || !form.unit.trim()) {
      setFormError('Код, наименование и мерна единица са задължителни')
      return
    }
    if (!editingProduct && form.initialStock > 0 && !form.warehouseId) {
      setFormError('Изберете склад за началната наличност')
      return
    }
    if (editingProduct && form.stockAdjustment !== 0 && !form.warehouseId) {
      setFormError('Изберете склад за корекцията на наличност')
      return
    }
    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        data: {
          name: form.name,
          unit: form.unit,
          barcode: form.barcode || null,
          minStock: Number(form.minStock),
          price: form.price ? Number(form.price) : null,
          description: form.description || null,
          stockAdjustment: Number(form.stockAdjustment),
          warehouseId: form.warehouseId || null
        }
      })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleBarcodeScanned = useCallback(
    (product: any) => {
      setScannerOpen(false)
      if (scannerTarget === 'form') {
        setForm((f) => ({ ...f, barcode: product.barcode || '' }))
      } else {
        setSearch(product.barcode || product.code)
      }
    },
    [scannerTarget]
  )

  const handleRawBarcode = useCallback((barcode: string) => {
    setForm((f) => ({ ...f, barcode }))
    setScannerOpen(false)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Продукти"
        subtitle="Управление на продуктовия каталог с баркодове"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              icon={<Scan size={14} />}
              onClick={() => {
                setScannerTarget('search')
                setScannerOpen(true)
              }}
            >
              Сканирай и намери
            </Button>
            <Button
              icon={<Plus size={14} />}
              onClick={() => {
                setShowForm(true)
                setEditingProduct(null)
                setForm(emptyForm)
              }}
            >
              Нов продукт
            </Button>
          </div>
        }
      />

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            {editingProduct ? `Редактиране: ${editingProduct.name}` : 'Нов продукт'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                Код *
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="PROD-001"
                disabled={!!editingProduct}
                style={{
                  ...inputStyle,
                  background: editingProduct ? '#f9fafb' : 'white',
                  fontFamily: 'monospace'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                Наименование *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Продукт А"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                М.Е. *
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                Баркод
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="EAN-13 или друг формат"
                  style={{ ...inputStyle, fontFamily: 'monospace', flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button
                  onClick={() => {
                    setScannerTarget('form')
                    setScannerOpen(true)
                  }}
                  title="Сканирай баркод"
                  type="button"
                  style={{
                    padding: '0 12px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 8,
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#7c3aed',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f3ff'
                    e.currentTarget.style.borderColor = '#7c3aed'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  <Scan size={16} />
                </button>
              </div>
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                Мин. наличност
              </label>
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
              >
                Цена (лв.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
            >
              Описание
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Незадължително описание..."
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {editingProduct && (
            <div
              style={{
                marginBottom: 16,
                padding: '14px 16px',
                background: '#f8faff',
                border: '1px solid #e0e7ff',
                borderRadius: 10
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#4f46e5',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Корекция на наличност
              </div>

              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                Текуща наличност:{' '}
                <strong style={{ color: '#0f172a' }}>
                  {editingProduct.stockItems?.reduce((s, si) => s + si.quantity, 0) ?? 0} {editingProduct.unit}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
                  >
                    Корекция (+ добави / - извади)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.stockAdjustment}
                    onChange={(e) => setForm((f) => ({ ...f, stockAdjustment: Number(e.target.value) }))}
                    placeholder="0"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  {form.stockAdjustment !== 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: form.stockAdjustment > 0 ? '#059669' : '#dc2626'
                      }}
                    >
                      {form.stockAdjustment > 0
                        ? `+${form.stockAdjustment} ще се добавят`
                        : `${form.stockAdjustment} ще се извадят`}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
                  >
                    Склад
                  </label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                    style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">— Изберете склад —</option>
                    {(warehouses as Array<{ id: string; name: string }>).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.stockAdjustment !== 0 && !form.warehouseId && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#d97706' }}>
                  ⚠ Изберете склад за да се запише корекцията
                </div>
              )}
            </div>
          )}

          {!editingProduct && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label
                  style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
                >
                  Начална наличност
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(незадължително)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.initialStock}
                  onChange={(e) => setForm((f) => ({ ...f, initialStock: Number(e.target.value) }))}
                  placeholder="0"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}
                >
                  Склад за наличността
                </label>
                <select
                  value={form.warehouseId}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                >
                  <option value="">— Изберете склад —</option>
                  {(warehouses as Array<{ id: string; name: string }>).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formError && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 13,
                marginBottom: 14
              }}
            >
              ⚠️ {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleCancel}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? 'Запазване...'
                : editingProduct
                  ? 'Запази промените'
                  : 'Създай продукт'}
            </Button>
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търси по код, наименование или баркод..."
          style={{ ...inputStyle, paddingLeft: 36, paddingRight: search ? 36 : 12 }}
          onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            type="button"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 2
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Зареждане...</div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Код', 'Наименование', 'М.Е.', 'Баркод', 'Мин.', 'Цена', 'Наличност', 'Статус', 'Действия'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6b7280'
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    {search ? `Няма продукти за "${search}"` : 'Няма добавени продукти'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const totalStock = p.stockItems?.reduce((s, si) => s + si.quantity, 0) ?? 0
                  const isLow = totalStock < p.minStock
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: !p.isActive ? '#fafafa' : 'white',
                        opacity: p.isActive ? 1 : 0.6
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 16px',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#7c3aed'
                        }}
                      >
                        {p.code}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, fontSize: 13 }}>
                        {p.name}
                        {p.description && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.description}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                        {p.unit}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.barcode ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Scan size={11} color="#7c3aed" />
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
                              {p.barcode}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                        {p.minStock} {p.unit}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {p.price != null ? `${Number(p.price).toFixed(2)} лв.` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: isLow ? '#dc2626' : '#059669'
                          }}
                        >
                          {totalStock} {p.unit}
                        </span>
                        {isLow && (
                          <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>⚠ под минимум</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            background: p.isActive ? '#dcfce7' : '#fee2e2',
                            color: p.isActive ? '#166534' : '#991b1b'
                          }}
                        >
                          {p.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleEdit(p)}
                            title="Редактирай"
                            type="button"
                            style={{
                              padding: '5px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              background: 'white',
                              cursor: 'pointer',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => toggleMutation.mutate({ id: p.id, isActive: p.isActive })}
                            title={p.isActive ? 'Деактивирай' : 'Активирай'}
                            type="button"
                            style={{
                              padding: '5px 8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              background: 'white',
                              cursor: 'pointer',
                              color: p.isActive ? '#dc2626' : '#059669',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {p.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #f3f4f6',
              fontSize: 12,
              color: '#9ca3af'
            }}
          >
            {filtered.length} от {products.length} продукта
          </div>
        </div>
      )}

      {scannerOpen && (
        <BarcodeScanner
          title={scannerTarget === 'form' ? 'Сканирай баркод за продукта' : 'Намери продукт по баркод'}
          onProductFound={handleBarcodeScanned}
          onClose={() => setScannerOpen(false)}
          onNotFound={scannerTarget === 'form' ? handleRawBarcode : undefined}
        />
      )}
    </div>
  )
}
