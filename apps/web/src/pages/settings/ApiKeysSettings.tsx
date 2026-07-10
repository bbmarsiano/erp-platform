import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface ApiKeyRow {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt?: string | null
}

const SCOPE_OPTIONS = [
  { value: 'module:finance', label: 'Finance' },
  { value: 'module:wms', label: 'WMS' },
  { value: 'module:scm', label: 'SCM' },
  { value: 'module:mes', label: 'MES' },
  { value: 'module:pos', label: 'POS' },
  { value: 'module:backup', label: 'Backup' }
]

function maskPrefix(prefix: string): string {
  return `${prefix}****`
}

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['module:finance'])
  const [creating, setCreating] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadKeys = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/settings/api-keys')
      setKeys(res.data.data ?? [])
    } catch {
      setError('Неуспешно зареждане на API ключовете')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleCreate = async () => {
    if (!name.trim() || scopes.length === 0) {
      setError('Въведете име и изберете поне един обхват')
      return
    }
    setCreating(true)
    setError('')
    try {
      const res = await api.post('/api/settings/api-keys', { name: name.trim(), scopes })
      setNewRawKey(res.data.data.rawKey)
      setShowCreate(false)
      setName('')
      setScopes(['module:finance'])
      await loadKeys()
    } catch {
      setError('Неуспешно създаване на API ключ')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да отмените този API ключ?')) return
    setRevokingId(id)
    setError('')
    try {
      await api.delete(`/api/settings/api-keys/${id}`)
      await loadKeys()
    } catch {
      setError('Неуспешна отмяна на API ключ')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 24
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>API ключове</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Дълготрайни ключове за интеграции (CRM, външни системи). Използвайте{' '}
            <code>Authorization: Bearer &lt;ключ&gt;</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true)
            setError('')
          }}
          style={{
            padding: '8px 14px',
            background: '#111',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          + Нов ключ
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>Зареждане...</div>
      ) : keys.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>Няма създадени API ключове.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {keys.map((key) => (
            <div
              key={key.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                opacity: key.isActive && !key.revokedAt ? 1 : 0.6
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{key.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151', marginTop: 4 }}>
                  {maskPrefix(key.keyPrefix)}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                  Обхват: {key.scopes.join(', ') || '—'}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Създаден: {new Date(key.createdAt).toLocaleString('bg-BG')}
                  {key.lastUsedAt && ` · Последна употреба: ${new Date(key.lastUsedAt).toLocaleString('bg-BG')}`}
                  {key.revokedAt && ' · Отменен'}
                </div>
              </div>
              {key.isActive && !key.revokedAt && (
                <button
                  type="button"
                  onClick={() => void handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  {revokingId === key.id ? '...' : 'Отмени'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !creating && setShowCreate(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: 420,
              maxWidth: '90vw'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Нов API ключ</h3>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Име</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CRM Integration"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14
              }}
            />
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Обхват</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SCOPE_OPTIONS.map((opt) => (
                <label key={opt.value} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={scopes.includes(opt.value)}
                    onChange={() => toggleScope(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                style={{
                  padding: '8px 14px',
                  background: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                {creating ? 'Създаване...' : 'Генерирай'}
              </button>
            </div>
          </div>
        </div>
      )}

      {newRawKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: 480,
              maxWidth: '90vw'
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>API ключът е създаден</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#b45309', background: '#fffbeb', padding: 12, borderRadius: 8 }}>
              ⚠️ Копирайте ключа сега. Той <strong>няма</strong> да се покаже отново.
            </p>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                wordBreak: 'break-all',
                marginBottom: 16
              }}
            >
              {newRawKey}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(newRawKey)}
                style={{
                  padding: '8px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Копирай
              </button>
              <button
                type="button"
                onClick={() => setNewRawKey(null)}
                style={{
                  padding: '8px 14px',
                  background: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
