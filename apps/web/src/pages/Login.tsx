import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('admin@dflowerp.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 20
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }}
      />

      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              margin: '0 auto 14px',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 8px 20px rgba(102,126,234,0.4)'
            }}
          >
            ⚡
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.3px'
            }}
          >
            DFlowERP
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Влезте в своя акаунт</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                marginBottom: 16,
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

          {[
            { id: 'email', label: 'Имейл адрес', type: 'email', placeholder: 'admin@firma.bg' },
            { id: 'password', label: 'Парола', type: 'password', placeholder: '••••••••' }
          ].map((field) => (
            <div key={field.id} style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 6
                }}
              >
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={field.id === 'email' ? email : password}
                onChange={(e) =>
                  field.id === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)
                }
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg,#667eea,#764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(102,126,234,0.4)',
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Влизане...' : 'Влез в системата'}
          </button>
        </form>
      </div>
    </div>
  )
}
