import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export function TopBar() {
  const [companyName, setCompanyName] = useState('DFlowERP')

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => {
        if (r.data.data?.name) setCompanyName(r.data.data.name)
      })
      .catch(() => {})
  }, [])

  return (
    <div
      style={{
        height: 56,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{companyName}</span>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>Core shell v0.1.0</span>
    </div>
  )
}
