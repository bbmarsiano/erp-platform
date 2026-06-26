import { useToastStore } from '../../store/toast.store'

const variantStyles = {
  default: { background: '#1e293b', color: '#f8fafc' },
  success: { background: '#166534', color: '#f0fdf4' },
  error: { background: '#991b1b', color: '#fef2f2' }
}

export function Toast() {
  const message = useToastStore((s) => s.message)
  const variant = useToastStore((s) => s.variant)
  const clear = useToastStore((s) => s.clear)

  if (!message) return null

  const style = variantStyles[variant]

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
        background: style.background,
        color: style.color,
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
          color: 'inherit',
          opacity: 0.7,
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
