import { useMemo, useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import {
  useCreateLocation,
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouseLocations,
  useWarehouses
} from '../hooks/useWms'

interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  isActive: boolean
}

interface Location {
  id: string
  code: string
  name: string
  zone?: string | null
  locationType?: string
  isActive: boolean
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  SHELF: 'Стелаж',
  FLOOR: 'Под',
  RACK: 'Рафт',
  ZONE: 'Зона',
  OTHER: 'Друго',
  STORAGE: 'Складиране',
  RECEIVING: 'Приемане',
  DISPATCH: 'Изпращане',
  QUARANTINE: 'Карантина',
  PRODUCTION: 'Производство'
}

function locationTypeLabel(loc: Location): string {
  if (loc.zone && LOCATION_TYPE_LABELS[loc.zone]) return LOCATION_TYPE_LABELS[loc.zone]
  if (loc.locationType && LOCATION_TYPE_LABELS[loc.locationType]) return LOCATION_TYPE_LABELS[loc.locationType]
  return loc.zone || loc.locationType || '—'
}

export default function Warehouses() {
  const { data, isLoading, error, refetch } = useWarehouses()
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()

  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')

  const [locationForm, setLocationForm] = useState({ code: '', type: 'SHELF', description: '' })

  const { data: locations = [], refetch: refetchLocations } = useWarehouseLocations(
    selectedWarehouse?.id
  )
  const createLocation = useCreateLocation()

  const rows = useMemo(() => (data ?? []) as Warehouse[], [data])

  const onSubmit = async () => {
    if (!code.trim() || !name.trim()) return
    await createWarehouse.mutateAsync({ code: code.trim(), name: name.trim(), address: address.trim() || undefined })
    setCode('')
    setName('')
    setAddress('')
    setShowForm(false)
  }

  const openEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setEditName(warehouse.name)
    setEditAddress(warehouse.address ?? '')
    setSelectedWarehouse(null)
  }

  const saveEdit = async () => {
    if (!editingWarehouse || !editName.trim()) return
    await updateWarehouse.mutateAsync({
      id: editingWarehouse.id,
      name: editName.trim(),
      address: editAddress.trim() || undefined
    })
    setEditingWarehouse(null)
    await refetch()
    if (selectedWarehouse?.id === editingWarehouse.id) {
      setSelectedWarehouse({ ...selectedWarehouse, name: editName.trim(), address: editAddress.trim() || undefined })
    }
  }

  const handleCreateLocation = async () => {
    if (!selectedWarehouse || !locationForm.code.trim()) return
    await createLocation.mutateAsync({
      warehouseId: selectedWarehouse.id,
      code: locationForm.code.trim(),
      type: locationForm.type,
      description: locationForm.description.trim() || undefined
    })
    setLocationForm({ code: '', type: 'SHELF', description: '' })
    await refetchLocations()
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Складове"
        subtitle="Управление на складове и адреси"
        help={{
          title: 'Складове',
          content:
            'Складовете са физически места за съхранение на стоки. Всеки склад може да има множество локации (напр. A-01, B-02) за точно проследяване.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нов склад</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Код" required>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WH-01" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Основен склад" />
            </FormField>
            <FormField label="Адрес">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="София, България" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={() => void onSubmit()} disabled={createWarehouse.isPending}>
              {createWarehouse.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      {editingWarehouse ? (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>
            Редактиране — {editingWarehouse.code}
          </div>
          <FormRow columns={2}>
            <FormField label="Наименование" required>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </FormField>
            <FormField label="Адрес">
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditingWarehouse(null)}>
              Отказ
            </Button>
            <Button onClick={() => void saveEdit()} disabled={updateWarehouse.isPending}>
              {updateWarehouse.isPending ? 'Запис...' : 'Запази'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Код</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Наименование</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Адрес</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#991b1b' }}>
                  Грешка при зареждане на складове
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>
                  Няма складове
                </td>
              </tr>
            ) : (
              rows.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{w.code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{w.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{w.address ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {w.isActive ? <StatusBadge status="CONFIRMED" /> : <StatusBadge status="CANCELLED" />}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWarehouse(w)
                          setEditingWarehouse(null)
                        }}
                        style={{
                          padding: '5px 12px',
                          border: `1px solid ${selectedWarehouse?.id === w.id ? '#7c3aed' : '#e5e7eb'}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          background: selectedWarehouse?.id === w.id ? '#f5f3ff' : 'white',
                          color: selectedWarehouse?.id === w.id ? '#7c3aed' : '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'inherit'
                        }}
                      >
                        🏪 Локации
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        style={{
                          padding: '5px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          background: 'white',
                          color: '#374151',
                          fontFamily: 'inherit'
                        }}
                      >
                        ✏️ Редактирай
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedWarehouse && (
        <div
          style={{
            marginTop: 24,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              🏪 Локации — {selectedWarehouse.name}
            </div>
            <button
              type="button"
              onClick={() => setSelectedWarehouse(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#6b7280',
                fontFamily: 'inherit'
              }}
            >
              ✕ Затвори
            </button>
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 4
                }}
              >
                Код *
              </label>
              <input
                value={locationForm.code}
                onChange={(e) => setLocationForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="A-01"
                style={{
                  padding: '8px 10px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 7,
                  fontSize: 13,
                  width: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 4
                }}
              >
                Тип
              </label>
              <select
                value={locationForm.type}
                onChange={(e) => setLocationForm((f) => ({ ...f, type: e.target.value }))}
                style={{
                  padding: '8px 10px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 7,
                  fontSize: 13,
                  background: 'white',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="SHELF">Стелаж</option>
                <option value="FLOOR">Под</option>
                <option value="RACK">Рафт</option>
                <option value="ZONE">Зона</option>
                <option value="OTHER">Друго</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 4
                }}
              >
                Описание
              </label>
              <input
                value={locationForm.description}
                onChange={(e) => setLocationForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Метални профили"
                style={{
                  padding: '8px 10px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 7,
                  fontSize: 13,
                  width: '100%',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleCreateLocation()}
              disabled={!locationForm.code.trim() || createLocation.isPending}
              style={{
                padding: '8px 16px',
                background: createLocation.isPending ? '#9ca3af' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: 7,
                cursor: !locationForm.code.trim() || createLocation.isPending ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap'
              }}
            >
              + Добави
            </button>
          </div>

          <div style={{ padding: '8px 0' }}>
            {(locations as Location[]).length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Няма добавени локации. Добавете първата локация по-горе.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Код', 'Тип', 'Описание', 'Баркод', 'Статус'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 20px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#6b7280',
                          textTransform: 'uppercase'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(locations as Location[]).map((loc) => (
                    <tr key={loc.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td
                        style={{
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#0f172a',
                          fontFamily: 'monospace'
                        }}
                      >
                        {loc.code}
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 13 }}>{locationTypeLabel(loc)}</td>
                      <td style={{ padding: '10px 20px', fontSize: 13, color: '#6b7280' }}>
                        {loc.name || '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 20px',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: '#9ca3af'
                        }}
                      >
                        —
                      </td>
                      <td style={{ padding: '10px 20px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: loc.isActive ? '#dcfce7' : '#fee2e2',
                            color: loc.isActive ? '#166534' : '#991b1b'
                          }}
                        >
                          {loc.isActive ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
