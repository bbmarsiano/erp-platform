import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  to?: string
  label?: string
}

export function BackButton({ to, label = 'Назад' }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        background: 'white',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: '#374151',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        marginBottom: 20
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#7c3aed'
        e.currentTarget.style.color = '#7c3aed'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.color = '#374151'
      }}
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  )
}
