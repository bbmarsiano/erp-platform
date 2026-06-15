import { useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select } from '../../../components/ui'
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
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Каси"
        subtitle="Управление на POS каси"
        help={{
          title: 'Каси',
          content:
            'Управление на физическите каси. Всяка каса е свързана с конкретен склад и локация. Необходима е поне една активна каса за да работи POS терминалът.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова каса</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={4}>
            <FormField label="Код" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="POS-01" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Каса 1" />
            </FormField>
            <FormField label="Склад" required>
              <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
            </FormField>
            <FormField label="Локация" required>
              <Select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
                <option value="">Изберете локация</option>
                {((locations.data ?? []) as Array<any>).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createRegister.isPending}>
              {createRegister.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Код</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Наименование</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Склад</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Локация</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {((registers.data ?? []) as Array<any>).map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.code}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.warehouse?.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.location?.code}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.isActive ? 'Активна' : 'Неактивна'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
