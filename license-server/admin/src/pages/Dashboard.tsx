import { CSSProperties, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
  totalTenants: number
  activeLicenses: number
  expiringSoon: number
  validationsWeek: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeLicenses: 0,
    expiringSoon: 0,
    validationsWeek: 0
  })

  useEffect(() => {
    const load = async () => {
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [{ count: totalTenants }, { count: activeLicenses }, { count: expiringSoon }, { count: validationsWeek }] =
        await Promise.all([
          supabase.from('tenants').select('*', { count: 'exact', head: true }),
          supabase.from('license_keys').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('license_keys').select('*', { count: 'exact', head: true }).lt('expires_at', in30Days.toISOString()),
          supabase.from('validation_log').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString())
        ])

      setStats({
        totalTenants: totalTenants ?? 0,
        activeLicenses: activeLicenses ?? 0,
        expiringSoon: expiringSoon ?? 0,
        validationsWeek: validationsWeek ?? 0
      })
    }

    void load()
  }, [])

  const cardStyle: CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 18,
    background: '#f9fafb'
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280' }}>Total tenants</div>
          <strong style={{ fontSize: 24 }}>{stats.totalTenants}</strong>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280' }}>Active license keys</div>
          <strong style={{ fontSize: 24 }}>{stats.activeLicenses}</strong>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280' }}>Expiring in 30 days</div>
          <strong style={{ fontSize: 24 }}>{stats.expiringSoon}</strong>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280' }}>Validations this week</div>
          <strong style={{ fontSize: 24 }}>{stats.validationsWeek}</strong>
        </div>
      </div>
    </div>
  )
}

