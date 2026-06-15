import { useState, type CSSProperties } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpTooltipProps {
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function HelpTooltip({ title, content, position = 'bottom' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)

  const positionStyles: Record<string, CSSProperties> = {
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={title}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          color: open ? '#7c3aed' : '#9ca3af',
          transition: 'color 0.15s'
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.color = '#7c3aed'
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.color = '#9ca3af'
        }}
      >
        <HelpCircle size={15} />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: 'absolute',
              ...positionStyles[position],
              zIndex: 100,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '14px 16px',
              width: 280,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 0,
                  marginLeft: 8,
                  flexShrink: 0
                }}
              >
                <X size={13} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              {content.split('\n').map((line, i) =>
                line.trim() ? <div key={i}>{line}</div> : <div key={i} style={{ height: 6 }} />
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid #f3f4f6',
                fontSize: 11,
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <HelpCircle size={10} />
              <a href="/help" style={{ color: '#7c3aed', textDecoration: 'none' }}>
                Виж пълното ръководство →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
