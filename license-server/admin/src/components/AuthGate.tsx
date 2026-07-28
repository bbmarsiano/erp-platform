import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthenticated(!!data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    if (signError) {
      setError(signError.message || 'Неуспешен вход')
      setPassword('')
    }
    setLoading(false)
  }

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'var(--font)'
        }}
      >
        Зареждане...
      </div>
    )
  }

  if (authenticated) return <>{children}</>

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
            right: (b as { right?: string }).right,
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
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>DFlow License Admin</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Вход с Supabase Auth
          </div>
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
                fontSize: 13
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            Имейл
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={{
              width: '100%',
              padding: '11px 14px',
              marginBottom: 16,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              fontSize: 14,
              color: 'white',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            Парола
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '11px 14px',
              marginBottom: 20,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              fontSize: 14,
              color: 'white',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '12px',
              background:
                loading || !email || !password
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {loading ? 'Вход...' : 'Влез'}
          </button>
        </form>
      </div>
    </div>
  )
}
