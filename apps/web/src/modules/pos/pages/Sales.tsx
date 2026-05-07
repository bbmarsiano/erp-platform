import { useNavigate } from 'react-router-dom'
import { useSales } from '../hooks/usePos'

const paymentMap: Record<string, { label: string; bg: string; color: string }> = {
  CASH: { label: 'Кеш', bg: '#fef9c3', color: '#854d0e' },
  CARD: { label: 'Карта', bg: '#dbeafe', color: '#1e40af' },
  MIXED: { label: 'Смесено', bg: '#e9d5ff', color: '#6b21a8' }
}
const saleStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  COMPLETED: { label: 'Завършена', bg: '#dcfce7', color: '#166534' },
  REFUNDED: { label: 'Върната', bg: '#fef9c3', color: '#854d0e' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
}

export default function Sales() {
  const navigate = useNavigate()
  const sales = useSales()
  const rows = (sales.data ?? []) as Array<any>
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Продажби</div>
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Каса</th>
              <th style={{ padding: 10 }}>Метод на плащане</th>
              <th style={{ padding: 10 }}>Сума</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} onClick={() => navigate(`/pos/sales/${s.id}`)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{s.saleNo}</td>
                <td style={{ padding: 10 }}>{s.cashRegister?.name ?? '-'}</td>
                <td style={{ padding: 10 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: paymentMap[s.paymentMethod]?.bg, color: paymentMap[s.paymentMethod]?.color }}>
                    {paymentMap[s.paymentMethod]?.label ?? s.paymentMethod}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{s.totalAmount.toFixed(2)} лв.</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: saleStatusMap[s.status]?.bg ?? '#f3f4f6',
                      color: saleStatusMap[s.status]?.color ?? '#374151'
                    }}
                  >
                    {saleStatusMap[s.status]?.label ?? s.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{new Date(s.createdAt).toLocaleString('bg-BG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

