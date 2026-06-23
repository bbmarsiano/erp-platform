import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'

const WARNING_BEFORE_MS = 2 * 60 * 1000
const COUNTDOWN_SECONDS = 120

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function SessionWarning() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [extending, setExtending] = useState(false)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const countdownTimerRef = useRef<ReturnType<typeof setInterval>>()

  const clearTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current)
    clearInterval(countdownTimerRef.current)
  }, [])

  const handleLogout = useCallback(() => {
    clearTimers()
    setShowWarning(false)
    logout()
  }, [clearTimers, logout])

  const handleExtend = useCallback(async () => {
    setExtending(true)
    try {
      const storedRefresh = useAuthStore.getState().refreshToken
      if (!storedRefresh) {
        handleLogout()
        return
      }
      const res = await api.post('/api/auth/refresh', { refreshToken: storedRefresh })
      const { accessToken: newToken, refreshToken: newRefresh } = res.data.data
      useAuthStore.getState().setTokens(newToken, newRefresh ?? storedRefresh)
      setShowWarning(false)
      setCountdown(COUNTDOWN_SECONDS)
    } catch {
      handleLogout()
    } finally {
      setExtending(false)
    }
  }, [handleLogout])

  const scheduleWarning = useCallback(
    (token: string) => {
      clearTimers()
      const expiry = getTokenExpiry(token)
      if (!expiry) return

      const now = Date.now()
      const msUntilWarning = expiry - now - WARNING_BEFORE_MS
      const msUntilExpiry = expiry - now

      if (msUntilExpiry <= 0) {
        handleLogout()
        return
      }

      if (msUntilWarning <= 0) {
        const secondsLeft = Math.max(0, Math.floor((expiry - now) / 1000))
        setCountdown(secondsLeft)
        setShowWarning(true)
      } else {
        warningTimerRef.current = setTimeout(() => {
          setCountdown(COUNTDOWN_SECONDS)
          setShowWarning(true)
        }, msUntilWarning)
      }
    },
    [clearTimers, handleLogout]
  )

  useEffect(() => {
    if (!accessToken) {
      clearTimers()
      setShowWarning(false)
      return
    }
    scheduleWarning(accessToken)
    return clearTimers
  }, [accessToken, scheduleWarning, clearTimers])

  useEffect(() => {
    if (!showWarning) return

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current)
          handleLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownTimerRef.current)
  }, [showWarning, handleLogout])

  if (!showWarning) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`
  const urgency = countdown < 30

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)'
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 10000,
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: 16,
          padding: '32px 28px',
          width: 380,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: urgency ? '#fef2f2' : '#fefce8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26
          }}
        >
          {urgency ? '⏰' : '🔔'}
        </div>

        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Сесията изтича скоро
        </div>

        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
          Вашата сесия ще изтече автоматично след:
        </div>

        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            marginBottom: 8,
            color: urgency ? '#dc2626' : '#d97706',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            transition: 'color 0.3s'
          }}
        >
          {timeStr}
        </div>

        <div
          style={{
            height: 4,
            background: '#f3f4f6',
            borderRadius: 2,
            marginBottom: 24,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              background: urgency ? '#dc2626' : '#d97706',
              width: `${(countdown / COUNTDOWN_SECONDS) * 100}%`,
              transition: 'width 1s linear, background 0.3s'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: '11px 16px',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              background: 'white',
              color: '#374151',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2'
              e.currentTarget.style.borderColor = '#fca5a5'
              e.currentTarget.style.color = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.color = '#374151'
            }}
          >
            Излез сега
          </button>
          <button
            type="button"
            onClick={handleExtend}
            disabled={extending}
            style={{
              flex: 2,
              padding: '11px 16px',
              border: 'none',
              borderRadius: 10,
              background: extending ? '#9ca3af' : '#7c3aed',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: extending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: extending ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
              transition: 'all 0.15s'
            }}
          >
            {extending ? '⏳ Удължаване...' : '✅ Продължи сесията'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 14 }}>
          При неактивност сесията ще бъде прекратена автоматично
        </div>
      </div>
    </>
  )
}
