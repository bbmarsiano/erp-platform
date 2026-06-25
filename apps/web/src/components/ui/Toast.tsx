import { useToastStore } from '../../store/toast.store'

export function Toast() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)

  if (!message) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 360,
        padding: '12px 16px',
        borderRadius: 10,
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={clear}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          padding: 0
        }}
        aria-label="Затвори"
      >
        ×
      </button>
    </div>
  )
}
