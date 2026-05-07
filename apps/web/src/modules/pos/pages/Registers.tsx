import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { WarehouseSelector } from '../../wms/components/WarehouseSelector'
import { useWarehouseLocations } from '../../wms/hooks/useWms'
import { useCreateRegister, useRegisters } from '../hooks/usePos'

export default function Registers() {
  const registers = useRegisters()
  const createRegister = useCreateRegister()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', warehouseId: '', locationId: '' })
  const locations = useWarehouseLocations(form.warehouseId)

  const onCreate = async () => {
    if (!form.code || !form.name || !form.warehouseId || !form.locationId) return
    await createRegister.mutateAsync(form)
    setShowForm(false)
    setForm({ code: '', name: '', warehouseId: '', locationId: '' })
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Каси</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нова каса'}</Button>
      </div>
      {showForm ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Код" style={{ padding: 8 }} />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Наименование" style={{ padding: 8 }} />
          <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
          <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Локация</option>
            {((locations.data ?? []) as Array<any>).map((l) => (
              <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
            ))}
          </select>
          <Button onClick={onCreate}>Създай</Button>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Код</th>
              <th style={{ padding: 10 }}>Наименование</th>
              <th style={{ padding: 10 }}>Склад</th>
              <th style={{ padding: 10 }}>Локация</th>
              <th style={{ padding: 10 }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {((registers.data ?? []) as Array<any>).map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{r.code}</td>
                <td style={{ padding: 10 }}>{r.name}</td>
                <td style={{ padding: 10 }}>{r.warehouse?.name}</td>
                <td style={{ padding: 10 }}>{r.location?.code}</td>
                <td style={{ padding: 10 }}>{r.isActive ? 'Активна' : 'Неактивна'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

