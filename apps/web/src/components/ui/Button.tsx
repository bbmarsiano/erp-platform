interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: React.ReactNode
}

const variants = {
  primary: {
    bg: '#0f172a',
    color: 'white',
    border: 'none',
    shadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  secondary: {
    bg: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    shadow: 'none'
  },
  danger: {
    bg: '#dc2626',
    color: 'white',
    border: 'none',
    shadow: '0 1px 3px rgba(220,38,38,0.2)'
  },
  success: {
    bg: '#16a34a',
    color: 'white',
    border: 'none',
    shadow: '0 1px 3px rgba(22,163,74,0.2)'
  }
}

const sizes = {
  sm: { padding: '6px 12px', fontSize: 12 },
  md: { padding: '9px 18px', fontSize: 13 }
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  icon
}: ButtonProps) {
  const v = variants[variant]
  const s = sizes[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        background: disabled ? '#e5e7eb' : v.bg,
        color: disabled ? '#9ca3af' : v.color,
        border: v.border,
        borderRadius: 8,
        boxShadow: v.shadow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s'
      }}
    >
      {icon}
      {children}
    </button>
  )
}
