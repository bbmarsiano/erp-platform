import { useState, useEffect } from 'react'

const STORAGE_KEY = 'dflow_admin_auth'
const SESSION_HOURS = 8

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { expires } = JSON.parse(stored)
        if (Date.now() < expires) {
          setUnlocked(true)
        } else {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    await new Promise((r) => setTimeout(r, 500))

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    if (!adminPassword) {
      setError('VITE_ADMIN_PASSWORD не е конфигуриран')
      setLoading(false)
      return
    }

    if (password === adminPassword) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          expires: Date.now() + SESSION_HOURS * 60 * 60 * 1000
        })
      )
      setUnlocked(true)
    } else {
      setError('Грешна парола')
      setPassword('')
    }
    setLoading(false)
  }

  if (unlocked) return <>{children}</>

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {[
        { top: '-10%', left: '-5%', size: 400, color: '#7c3aed' },
        { top: '60%', right: '-5%', size: 300, color: '#4f46e5' }
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            opacity: 0.08,
            filter: 'blur(60px)',
            top: b.top,
            left: b.left,
            right: b.right,
            pointerEvents: 'none'
          }}
        />
      ))}

      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 380,
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              fontSize: 22,
              boxShadow: '0 8px 20px rgba(124,58,237,0.4)'
            }}
          >
            ⚡
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>DFlowERP</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>License Admin Panel</div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                marginBottom: 16,
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8,
                color: '#fca5a5',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 8
              }}
            >
              Admin парола
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                fontSize: 14,
                color: 'white',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '12px',
              background:
                loading || !password ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading || !password ? 'none' : '0 4px 14px rgba(124,58,237,0.4)',
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Проверка...' : 'Влез в панела'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Сесията изтича след {SESSION_HOURS} часа
        </div>
      </div>
    </div>
  )
}
