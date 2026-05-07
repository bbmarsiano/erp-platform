type StockRow = {
  id: string
  quantity: number
  product: { code: string; name: string; minStock: number; unit?: string }
  location: { code: string; name: string; warehouse: { name: string } }
}

export function StockTable({ rows }: { rows: StockRow[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
          <th style={{ padding: 10 }}>Артикул</th>
          <th style={{ padding: 10 }}>Код</th>
          <th style={{ padding: 10 }}>Локация</th>
          <th style={{ padding: 10 }}>Склад</th>
          <th style={{ padding: 10 }}>Количество</th>
          <th style={{ padding: 10 }}>Мин. количество</th>
          <th style={{ padding: 10 }}>Статус</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const isLow = r.quantity <= r.product.minStock
          return (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: 10 }}>{r.product.name}</td>
              <td style={{ padding: 10, fontFamily: 'monospace' }}>{r.product.code}</td>
              <td style={{ padding: 10 }}>{r.location.code}</td>
              <td style={{ padding: 10 }}>{r.location.warehouse.name}</td>
              <td style={{ padding: 10, fontWeight: 700, color: isLow ? '#991b1b' : '#111827' }}>
                {r.quantity} {r.product.unit ?? ''}
              </td>
              <td style={{ padding: 10 }}>{r.product.minStock}</td>
              <td style={{ padding: 10 }}>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isLow ? '#fee2e2' : '#dcfce7',
                    color: isLow ? '#991b1b' : '#166534'
                  }}
                >
                  {isLow ? 'Под минимум' : 'Нормално'}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

