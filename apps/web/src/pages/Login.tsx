import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import logoLogin from '../assets/logo_login.png'
import { api } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('admin@dflowerp.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tenantName, setTenantName] = useState('')
  const [tenantLogo, setTenantLogo] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/api/public/tenant-info')
      .then((r) => {
        setTenantName(r.data.data.name || '')
        setTenantLogo(r.data.data.logoUrl || null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (tenantName && tenantName !== 'DFlowERP') {
      document.title = `${tenantName} — ERP`
    } else {
      document.title = 'DFlowERP'
    }
  }, [tenantName])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes meshMove1 {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(60px,-40px) scale(1.1); }
        66% { transform: translate(-30px,50px) scale(0.95); }
      }
      @keyframes meshMove2 {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(-50px,60px) scale(1.05); }
        66% { transform: translate(40px,-30px) scale(1.1); }
      }
      @keyframes meshMove3 {
        0%,100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(30px,40px) scale(1.08); }
      }
      @keyframes meshMove4 {
        0%,100% { transform: translate(0,0) scale(1); }
        40% { transform: translate(-40px,-50px) scale(1.06); }
        80% { transform: translate(20px,30px) scale(0.98); }
      }
      .login-input:focus {
        border-color: #7c3aed !important;
        box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important;
        outline: none !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Невалиден имейл или парола'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const blobs: Array<{
    color: string
    w: number
    h: number
    top?: string
    left?: string
    right?: string
    bottom?: string
    anim: string
  }> = [
    { color: '#7c3aed', w: 600, h: 600, top: '-15%', left: '-10%', anim: 'meshMove1 12s ease infinite' },
    { color: '#db2777', w: 500, h: 500, top: '40%', right: '-10%', anim: 'meshMove2 14s ease infinite' },
    { color: '#ea580c', w: 400, h: 400, bottom: '-10%', left: '20%', anim: 'meshMove3 10s ease infinite' },
    { color: '#9333ea', w: 350, h: 350, top: '10%', right: '20%', anim: 'meshMove4 16s ease infinite' }
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0118',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: 20
      }}
    >
      {blobs.map((blob, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: blob.w,
            height: blob.h,
            borderRadius: '50%',
            background: blob.color,
            opacity: 0.18,
            filter: 'blur(80px)',
            animation: blob.anim,
            top: blob.top,
            left: blob.left,
            right: blob.right,
            bottom: blob.bottom,
            pointerEvents: 'none'
          }}
        />
      ))}

      <div
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          padding: '44px 40px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {tenantLogo ? (
            <img
              src={tenantLogo}
              alt={tenantName}
              style={{ maxWidth: 200, maxHeight: 60, objectFit: 'contain', marginBottom: 12 }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <img
              src={logoLogin}
              alt="DFlowERP"
              style={{ maxWidth: 200, maxHeight: 60, objectFit: 'contain', marginBottom: 12 }}
            />
          )}

          {tenantName && tenantName !== 'DFlowERP' && tenantName !== 'Demo Company' ? (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                {tenantName}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>ERP система</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>DFlowERP</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Влезте в своя акаунт</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                marginBottom: 20,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                color: '#dc2626',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6
              }}
            >
              Имейл адрес
            </label>
            <input
              className="login-input"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'inherit',
                background: 'white'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6
              }}
            >
              Парола
            </label>
            <input
              className="login-input"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'inherit',
                background: 'white'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(124,58,237,0.35)',
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Влизане...' : 'Влез в системата'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', margin: '20px 0 0' }}>
          powered by DFlowERP
        </p>
      </div>
    </div>
  )
}
