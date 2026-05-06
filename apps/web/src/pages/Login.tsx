import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/auth.store'

type LoginResponse = {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
  }
}

const Login = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { email, password })
      login(response.data.data)
      navigate('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: '#f3f4f6' }}>
      <form
        onSubmit={onSubmit}
        style={{ width: 360, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}
      >
        <h2 style={{ marginTop: 0 }}>Login to DFlowERP</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%' }} />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', marginTop: 10 }}
        />
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        <Button type="submit" style={{ width: '100%', marginTop: 12 }}>
          Sign in
        </Button>
      </form>
    </div>
  )
}

export default Login
