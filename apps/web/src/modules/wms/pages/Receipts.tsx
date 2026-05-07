import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../components/StatusBadge'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useCreateReceipt, useReceipts, useWarehouses } from '../hooks/useWms'

export default function Receipts() {
  const navigate = useNavigate()
  const receipts = useReceipts()
  const warehouses = useWarehouses()
  const createReceipt = useCreateReceipt()

  const [showForm, setShowForm] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [note, setNote] = useState('')

  const rows = useMemo(() => (receipts.data ?? []) as Array<any>, [receipts.data])
  const warehouseMap = useMemo(() => {
    const ws = (warehouses.data ?? []) as Array<{ id: string; name: string; code: string }>
    return new Map(ws.map((w) => [w.id, `${w.code} — ${w.name}`]))
  }, [warehouses.data])

  const onSubmit = async () => {
    if (!warehouseId) return
    const created = await createReceipt.mutateAsync({
      warehouseId,
      supplierName: supplierName.trim() || undefined,
      note: note.trim() || undefined
    })
    setShowForm(false)
    setWarehouseId('')
    setSupplierName('')
    setNote('')
    if (created?.id) navigate(`/wms/receipts/${created.id}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Приходни</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>Документи за приемане на стока</div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Отказ' : 'Нова приходна бележка'}</Button>
      </div>

      {showForm ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 10,
            alignItems: 'end'
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Склад
            <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Изберете склад" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Доставчик
            <input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Име на доставчик"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Бележка
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="По избор"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <Button onClick={onSubmit} disabled={createReceipt.isPending} style={{ height: 38 }}>
            {createReceipt.isPending ? 'Запис...' : 'Създай'}
          </Button>
        </div>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Склад</th>
              <th style={{ padding: 10 }}>Доставчик</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Дата</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {receipts.isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : receipts.error ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#991b1b' }}>
                  Грешка при зареждане на приходни документи
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>
                  Няма документи
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{r.receiptNo}</td>
                  <td style={{ padding: 10 }}>{warehouseMap.get(r.warehouseId) ?? '—'}</td>
                  <td style={{ padding: 10, color: '#6b7280' }}>{r.supplierName ?? '—'}</td>
                  <td style={{ padding: 10 }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: 10, color: '#6b7280' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—'}
                  </td>
                  <td style={{ padding: 10 }}>
                    <Button
                      onClick={() => navigate(`/wms/receipts/${r.id}`)}
                      style={{ background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}
                    >
                      Преглед
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

