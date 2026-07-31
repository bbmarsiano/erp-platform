import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { invokeAdmin } from '../lib/supabase'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Table, TableRow, Td } from '../components/ui/Table'

type BillingType = 'monthly' | 'annual' | 'lifetime'

type PricingRow = {
  productCode: string
  productName: string
  billingType: BillingType
  amount: number | null
  currency: string | null
  stripePriceId: string | null
  lookupKey: string
  status: 'ok' | 'missing'
}

const BILLING_LABELS: Record<BillingType, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  lifetime: 'Lifetime'
}

const BILLING_ORDER: BillingType[] = ['monthly', 'annual', 'lifetime']

const columns = [
  { key: 'billing', label: 'Период' },
  { key: 'price', label: 'Цена' },
  { key: 'status', label: 'Статус' },
  { key: 'lookup', label: 'Stripe Lookup Key' },
  { key: 'action', label: '' }
]

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100)
}

function stripePriceUrl(priceId: string, testMode: boolean): string {
  // test → /test/prices/... ; live → /prices/...
  const mode = testMode ? 'test' : ''
  return mode
    ? `https://dashboard.stripe.com/${mode}/prices/${priceId}`
    : `https://dashboard.stripe.com/prices/${priceId}`
}

export default function Pricing() {
  const [rows, setRows] = useState<PricingRow[]>([])
  const [stripeTestMode, setStripeTestMode] = useState(true)
  const [activeProduct, setActiveProduct] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    invokeAdmin<{ prices: PricingRow[]; stripeTestMode: boolean }>('admin-list-pricing')
      .then((data) => {
        const prices = data.prices ?? []
        setRows(prices)
        setStripeTestMode(Boolean(data.stripeTestMode))
        const first = prices[0]?.productCode
        if (first) setActiveProduct(first)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false))
  }, [])

  const products = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      if (!map.has(row.productCode)) map.set(row.productCode, row.productName)
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }))
  }, [rows])

  const productRows = useMemo(() => {
    return rows
      .filter((r) => r.productCode === activeProduct)
      .sort(
        (a, b) => BILLING_ORDER.indexOf(a.billingType) - BILLING_ORDER.indexOf(b.billingType)
      )
  }, [rows, activeProduct])

  if (loading) {
    return (
      <div style={{ padding: 32, color: '#9ca3af', textAlign: 'center' }}>Зареждане...</div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader
        title="Ценова конфигурация"
        subtitle="Текущи Stripe цени по продукт и период"
        action={
          stripeTestMode ? (
            <Badge label="Stripe Test mode" bg="#fef3c7" color="#92400e" />
          ) : (
            <Badge label="Stripe Live" bg="#dcfce7" color="#14532d" />
          )
        }
      />

      <div
        style={{
          marginBottom: 16,
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 13,
          color: '#475569',
          lineHeight: 1.5
        }}
      >
        Цените се управляват в Stripe Dashboard. Тук виждате само текущото състояние.
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#b91c1c',
            fontSize: 13
          }}
        >
          {error}
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {products.map((p) => {
            const active = activeProduct === p.code
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setActiveProduct(p.code)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${active ? '#7c3aed' : '#e5e7eb'}`,
                  background: active ? '#f5f3ff' : 'white',
                  color: active ? '#7c3aed' : '#374151',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      )}

      <Table columns={columns} emptyMessage="Няма продукти / цени">
        {productRows.map((row) => (
          <TableRow key={`${row.productCode}-${row.billingType}`}>
            <Td>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {BILLING_LABELS[row.billingType]}
              </span>
            </Td>
            <Td>
              {row.status === 'ok' ? (
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {formatAmount(row.amount, row.currency)}
                </span>
              ) : (
                <Badge label="Липсва в Stripe" bg="#fef2f2" color="#b91c1c" />
              )}
            </Td>
            <Td>
              {row.status === 'ok' ? (
                <Badge label="OK" bg="#dcfce7" color="#14532d" />
              ) : (
                <Badge label="missing" bg="#ffedd5" color="#9a3412" />
              )}
            </Td>
            <Td>
              <code
                style={{
                  fontSize: 12,
                  background: '#f8fafc',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  color: '#334155'
                }}
              >
                {row.lookupKey}
              </code>
            </Td>
            <Td>
              {row.status === 'ok' && row.stripePriceId ? (
                <a
                  href={stripePriceUrl(row.stripePriceId, stripeTestMode)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#7c3aed',
                    textDecoration: 'none'
                  }}
                >
                  Редактирай в Stripe
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
              )}
            </Td>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
