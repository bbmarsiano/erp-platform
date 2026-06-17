import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Users, Key, CheckCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

interface RecentLicense {
  id: string
  key: string
  billing_type?: string
  price_paid?: number | null
  currency?: string | null
  expires_at: string
  is_active: boolean
  created_at: string
  tenant?: { name: string } | null
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0, activeTenants: 0,
    totalLicenses: 0, activeLicenses: 0,
    expiringLicenses: 0, lifetimeLicenses: 0,
    totalRevenue: 0,
  })
  const [recentLicenses, setRecentLicenses] = useState<RecentLicense[]>([])

  useEffect(() => {
    const load = async () => {
      const [{ data: tenants }, { data: licenses }] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('license_keys').select('*, tenant:tenants(name)'),
      ])

      const now = new Date()
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      setStats({
        totalTenants:    tenants?.length || 0,
        activeTenants:   tenants?.filter(t => t.is_active).length || 0,
        totalLicenses:   licenses?.length || 0,
        activeLicenses:  licenses?.filter(l => l.is_active).length || 0,
        expiringLicenses: licenses?.filter(l =>
          l.is_active && l.billing_type !== 'lifetime' &&
          new Date(l.expires_at) < in30 && new Date(l.expires_at) > now
        ).length || 0,
        lifetimeLicenses: licenses?.filter(l => l.billing_type === 'lifetime').length || 0,
        totalRevenue: licenses?.reduce((s, l) => s + (Number(l.price_paid) || 0), 0) || 0,
      })

      setRecentLicenses((licenses || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5))
    }
    void load()
  }, [])

  const statCards = [
    { label: 'Активни клиенти', value: stats.activeTenants,
      total: stats.totalTenants, icon: <Users size={20} />, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Активни лицензи', value: stats.activeLicenses,
      total: stats.totalLicenses, icon: <Key size={20} />, color: '#059669', bg: '#f0fdf4' },
    { label: 'Изтичащи (30 дни)', value: stats.expiringLicenses,
      icon: <AlertTriangle size={20} />, color: '#d97706', bg: '#fefce8' },
    { label: 'Lifetime лицензи', value: stats.lifetimeLicenses,
      icon: <CheckCircle size={20} />, color: '#0891b2', bg: '#ecfeff' },
    { label: 'Общ приход', value: `${stats.totalRevenue.toLocaleString()} EUR`,
      icon: <TrendingUp size={20} />, color: '#059669', bg: '#f0fdf4' },
  ]

  return (
    <div>
      <PageHeader
        title="Табло"
        subtitle={`Добре дошли в DFlowERP License Admin — ${new Date().toLocaleDateString('bg-BG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Card key={i} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color,
              letterSpacing: '-0.5px' }}>
              {card.value}
            </div>
            {card.total !== undefined && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                от {card.total} общо
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#7c3aed" />
          Последно генерирани лицензи
        </div>
        {recentLicenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            Няма генерирани лицензи
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Ключ', 'Клиент', 'Тип', 'Цена', 'Изтича', 'Статус'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLicenses.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
                    color: '#374151', fontWeight: 600 }}>
                    {l.key.substring(0,4)}-****
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {l.tenant?.name || '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: l.billing_type === 'lifetime' ? '#f0fdf4' : '#dbeafe',
                      color:      l.billing_type === 'lifetime' ? '#166534' : '#1e40af'
                    }}>
                      {l.billing_type === 'lifetime' ? '♾️ Lifetime' : '📅 Annual'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                    {l.price_paid != null ? `${l.price_paid} ${l.currency || 'EUR'}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                    {l.billing_type === 'lifetime' ? '♾️' :
                      new Date(l.expires_at).toLocaleDateString('bg-BG')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: l.is_active ? '#dcfce7' : '#fee2e2',
                      color:      l.is_active ? '#166534' : '#991b1b'
                    }}>
                      {l.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
