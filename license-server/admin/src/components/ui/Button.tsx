interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variants = {
  primary:   { bg: '#7c3aed', color: '#fff', border: 'none', shadow: '0 2px 8px rgba(124,58,237,0.3)' },
  secondary: { bg: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', shadow: 'none' },
  danger:    { bg: '#dc2626', color: '#fff', border: 'none', shadow: '0 2px 8px rgba(220,38,38,0.2)' },
  success:   { bg: '#059669', color: '#fff', border: 'none', shadow: '0 2px 8px rgba(5,150,105,0.2)' },
  ghost:     { bg: 'transparent', color: '#6b7280', border: 'none', shadow: 'none' },
}

const sizes = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '9px 18px', fontSize: '13px' },
  lg: { padding: '12px 24px', fontSize: '14px' },
}

export function Button({ children, onClick, variant = 'primary', size = 'md',
  disabled, type = 'button', icon, fullWidth }: ButtonProps) {
  const v = variants[variant]
  const s = sizes[size]
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: s.padding, fontSize: s.fontSize, fontWeight: 600,
      background: disabled ? '#e5e7eb' : v.bg,
      color: disabled ? '#9ca3af' : v.color,
      border: v.border, borderRadius: 8,
      boxShadow: disabled ? 'none' : v.shadow,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      width: fullWidth ? '100%' : undefined,
      justifyContent: fullWidth ? 'center' : undefined,
    }}>
      {icon}{children}
    </button>
  )
}
