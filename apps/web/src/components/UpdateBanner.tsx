import { useState } from 'react'
import { ArrowUp, ExternalLink, X } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { APP_VERSION } from '../version'

const CURRENT_VERSION = APP_VERSION

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

export function UpdateBanner() {
  const user = useAuthStore((s) => s.user)
  const allowedVersion = useAuthStore((s) => s.allowedVersion)
  const [dismissed, setDismissed] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) return null
  if (!allowedVersion) return null
  if (compareVersions(allowedVersion, CURRENT_VERSION) <= 0) return null
  if (dismissed) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(124,58,237,0.1)',
          padding: '16px 20px',
          maxWidth: 360,
          animation: 'slideInUp 0.3s ease'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
            borderRadius: '14px 14px 0 0'
          }}
        />

        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(124,58,237,0.3)'
            }}
          >
            <ArrowUp size={18} color="white" />
          </div>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              Налично обновление
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              DFlowERP{' '}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#7c3aed',
                  background: '#f5f3ff',
                  padding: '1px 6px',
                  borderRadius: 4
                }}
              >
                v{allowedVersion}
              </span>{' '}
              е готово за инсталация.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowInstructions(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                }}
              >
                <ArrowUp size={12} />
                Обнови до v{allowedVersion}
              </button>
              <button
                onClick={() => setDismissed(true)}
                style={{
                  padding: '7px 12px',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                По-късно
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#9ca3af'
          }}
        >
          <span>Текуща версия: v{CURRENT_VERSION}</span>
          <a
            href="https://github.com/bbmarsiano/erp-platform/releases"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#7c3aed',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            Changelog <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {showInstructions && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '28px 32px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
              Обновяване до v{allowedVersion}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
              Следвайте стъпките за обновяване на DFlowERP:
            </p>

            {[
              { step: '1', text: 'Свалете новия installer от GitHub Releases' },
              { step: '2', text: 'Пуснете: dflow-installer --update' },
              { step: '3', text: 'Installer-ът автоматично ще направи backup на базата данни' },
              { step: '4', text: 'Новата версия ще се инсталира и стартира' },
              { step: '5', text: 'Влезте отново в системата' }
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {step}
                </div>
                <div style={{ fontSize: 13, color: '#374151', paddingTop: 3 }}>{text}</div>
              </div>
            ))}

            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: '#f8faff',
                border: '1px solid #e0e7ff',
                borderRadius: 8,
                fontSize: 12,
                color: '#4f46e5'
              }}
            >
              💡 Installer download: github.com/bbmarsiano/erp-platform/releases
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <a
                href={`https://github.com/bbmarsiano/erp-platform/releases/tag/v${allowedVersion}-installer`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  background: '#7c3aed',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                <ExternalLink size={14} />
                Свали Installer
              </a>
              <button
                onClick={() => setShowInstructions(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'white',
                  color: '#374151',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
