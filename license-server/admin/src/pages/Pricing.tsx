import { useEffect, useState } from 'react'
import { invokeAdmin } from '../lib/supabase'
import type { PricingConfig } from '../lib/pricing'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Pricing() {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    invokeAdmin<{ config: PricingConfig | null }>('admin-get-pricing')
      .then((data) => {
        if (data.config) setConfig(data.config)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
  }, [])

  const save = async () => {
    if (!config) return
    setSaving(true)
    setError('')
    try {
      await invokeAdmin('admin-update-pricing', { config })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  if (!config) {
    return (
      <div style={{ padding: 32, color: '#9ca3af', textAlign: 'center' }}>Зареждане...</div>
    )
  }

  const fieldStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit'
  }

  const section = (title: string) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#7c3aed',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginTop: 24,
        marginBottom: 12,
        paddingBottom: 6,
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      {title}
    </div>
  )

  const row = (
    label: string,
    annualKey: keyof PricingConfig['annual'],
    lifetimeKey: keyof PricingConfig['lifetime']
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 12,
        marginBottom: 10
      }}
    >
      <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center' }}>
        {label}
      </div>
      <div>
        <input
          type="number"
          value={config.annual[annualKey]}
          onChange={(e) =>
            setConfig((c) =>
              c
                ? {
                    ...c,
                    annual: { ...c.annual, [annualKey]: Number(e.target.value) }
                  }
                : c
            )
          }
          style={fieldStyle}
        />
      </div>
      <div>
        <input
          type="number"
          value={config.lifetime[lifetimeKey]}
          onChange={(e) =>
            setConfig((c) =>
              c
                ? {
                    ...c,
                    lifetime: { ...c.lifetime, [lifetimeKey]: Number(e.target.value) }
                  }
                : c
            )
          }
          style={fieldStyle}
        />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        title="Ценова конфигурация"
        subtitle="Промените влизат в сила при следващото генериране на лиценз"
      />

      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: 12,
            marginBottom: 8
          }}
        >
          <div />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>
            Annual (€/год)
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>
            Lifetime (€)
          </div>
        </div>

        {section('Базова цена (до 10 потребители, всички модули)')}
        {row('База', 'base', 'base')}

        {section('Допълнителни потребители')}
        {row('11-25 потребители', 'users_11_25', 'users_11_25')}
        {row('26-50 потребители', 'users_26_50', 'users_26_50')}
        {row('51+ потребители', 'users_51_plus', 'users_51_plus')}

        {section('Grace Period при изтекъл лиценз')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Grace Period (дни)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={config.grace_period_days}
              onChange={(e) =>
                setConfig((c) => (c ? { ...c, grace_period_days: Number(e.target.value) } : c))
              }
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Режим след grace period
            </label>
            <select
              value={config.grace_period_readonly ? 'readonly' : 'full'}
              onChange={(e) =>
                setConfig((c) =>
                  c ? { ...c, grace_period_readonly: e.target.value === 'readonly' } : c
                )
              }
              style={{ ...fieldStyle, background: 'white', cursor: 'pointer' }}
            >
              <option value="full">Пълен достъп (без ограничения)</option>
              <option value="readonly">Само четене (readonly)</option>
            </select>
          </div>
        </div>

        <Button type="button" onClick={() => void save()} disabled={saving} size="lg">
          {saving ? 'Запазване...' : saved ? '✓ Запазено!' : 'Запази настройките'}
        </Button>
      </Card>
    </div>
  )
}
