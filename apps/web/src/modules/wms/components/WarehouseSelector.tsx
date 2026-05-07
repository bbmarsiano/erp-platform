import { useMemo } from 'react'
import { useWarehouses } from '../hooks/useWms'

type Props = {
  value?: string
  onChange: (warehouseId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function WarehouseSelector({ value, onChange, placeholder = 'Изберете склад', disabled }: Props) {
  const { data, isLoading } = useWarehouses()

  const options = useMemo(() => {
    const warehouses = (data ?? []) as Array<{ id: string; code: string; name: string; isActive?: boolean }>
    return warehouses.filter((w) => w.isActive !== false)
  }, [data])

  return (
    <select
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid #d4d4d8',
        background: '#fff',
        minWidth: 240
      }}
    >
      <option value="">{isLoading ? 'Зареждане...' : placeholder}</option>
      {options.map((w) => (
        <option key={w.id} value={w.id}>
          {w.code} — {w.name}
        </option>
      ))}
    </select>
  )
}

