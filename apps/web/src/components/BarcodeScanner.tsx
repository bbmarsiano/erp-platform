import { useState, useCallback, useRef, useEffect } from 'react'
import { Scan, Camera, X } from 'lucide-react'
import { useBarcodeScannerInput, useCameraScanner } from '../hooks/useBarcodeScanner'
import { api } from '../lib/api'

export interface ScanResult {
  id: string
  code: string
  name: string
  barcode: string
  unit: string
  price?: number
  totalStock: number
  stockItems?: Array<{
    id: string
    quantity: number
    locationId: string
    location?: { id: string; code: string; warehouse?: { name: string } }
  }>
}

interface BarcodeScannerProps {
  onProductFound: (product: ScanResult) => void
  onClose: () => void
  title?: string
}

function playBeep(frequency: number, duration: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  } catch {
    /* ignore */
  }
}

export function BarcodeScanner({ onProductFound, onClose, title = 'Баркод скенер' }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'usb' | 'camera'>('usb')
  const [cameraActive, setCameraActive] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastScannedLabel, setLastScannedLabel] = useState('')
  const lastScanned = useRef<string>('')
  const scanTimeout = useRef<ReturnType<typeof setTimeout>>()
  const [result, setResult] = useState<{
    ok: boolean | null
    message: string
    product?: ScanResult
  } | null>(null)

  const handleScan = useCallback(
    async (barcode: string) => {
      if (barcode === lastScanned.current) return
      lastScanned.current = barcode
      setLastScannedLabel(barcode)
      clearTimeout(scanTimeout.current)
      scanTimeout.current = setTimeout(() => {
        lastScanned.current = ''
        setLastScannedLabel('')
      }, 2000)

      if (scanning) return
      setScanning(true)
      setResult(null)

      setResult({ ok: null, message: `Сканиран: ${barcode}` })

      try {
        const resp = await api.get(`/api/wms/products/by-barcode/${encodeURIComponent(barcode)}`)
        const product = resp.data.data as ScanResult
        setResult({ ok: true, message: `✓ Намерен: ${product.name}`, product })

        playBeep(800, 100)

        setTimeout(() => {
          onProductFound(product)
          setResult(null)
          lastScanned.current = ''
          setLastScannedLabel('')
        }, 1000)
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Баркодът не е намерен'
        setResult({ ok: false, message: `✗ ${msg} (${barcode})` })
        playBeep(200, 300)
        setTimeout(() => {
          setResult(null)
          lastScanned.current = ''
          setLastScannedLabel('')
        }, 3000)
      } finally {
        setScanning(false)
      }
    },
    [scanning, onProductFound]
  )

  useBarcodeScannerInput({ onScan: handleScan, active: mode === 'usb' })

  const { supported: cameraSupported } = useCameraScanner({
    onScan: handleScan,
    active: mode === 'camera' && cameraActive,
    elementId: 'barcode-camera-preview'
  })

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'scanner-styles'
    style.textContent = `
    @keyframes scanLine {
      0%   { top: 10%; opacity: 1; }
      50%  { top: 85%; opacity: 1; }
      100% { top: 10%; opacity: 1; }
    }
    @keyframes cornerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    #barcode-camera-preview video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
    }
    #barcode-camera-preview canvas {
      display: none !important;
    }
  `
    if (!document.getElementById('scanner-styles')) {
      document.head.appendChild(style)
    }
    return () => {
      const el = document.getElementById('scanner-styles')
      if (el) el.remove()
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
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
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea, #764ba2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Scan size={18} color="white" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} color="white" />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              background: '#f3f4f6',
              borderRadius: 10,
              padding: 4
            }}
          >
            {[
              { id: 'usb', label: 'USB/Bluetooth скенер', icon: <Scan size={14} /> },
              { id: 'camera', label: 'Камера', icon: <Camera size={14} /> }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id as 'usb' | 'camera')
                  setCameraActive(false)
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: mode === m.id ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: mode === m.id ? 600 : 400,
                  color: mode === m.id ? '#0f172a' : '#6b7280',
                  boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {mode === 'usb' && (
            <div>
              <div
                style={{
                  padding: '24px 20px',
                  background: '#f8faff',
                  border: '2px dashed #c7d2fe',
                  borderRadius: 12,
                  textAlign: 'center',
                  marginBottom: 16
                }}
              >
                <Scan size={32} color="#7c3aed" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Скенерът е активен</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Насочете скенера към баркода или въведете ръчно</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualInput) {
                      handleScan(manualInput)
                      setManualInput('')
                    }
                  }}
                  placeholder="Ръчно въвеждане на баркод..."
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualInput) {
                      handleScan(manualInput)
                      setManualInput('')
                    }
                  }}
                  style={{
                    padding: '9px 16px',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Търси
                </button>
              </div>
            </div>
          )}

          {mode === 'camera' && (
            <div>
              {!cameraActive ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Camera size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                  {!cameraSupported ? (
                    <div style={{ color: '#dc2626', fontSize: 13 }}>Камерата не е поддържана на това устройство</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Кликнете за да активирате камерата</div>
                      <button
                        type="button"
                        onClick={() => setCameraActive(true)}
                        style={{
                          padding: '10px 24px',
                          background: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600
                        }}
                      >
                        Активирай камера
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 260,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#000'
                    }}
                  >
                    <div
                      id="barcode-camera-preview"
                      style={{
                        position: 'absolute',
                        inset: 0
                      }}
                    />

                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '20%',
                          background: 'rgba(0,0,0,0.5)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '20%',
                          background: 'rgba(0,0,0,0.5)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '20%',
                          left: 0,
                          width: '10%',
                          height: '60%',
                          background: 'rgba(0,0,0,0.5)'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '20%',
                          right: 0,
                          width: '10%',
                          height: '60%',
                          background: 'rgba(0,0,0,0.5)'
                        }}
                      />

                      {[
                        { top: '20%', left: '10%', borderTop: '3px solid #7c3aed', borderLeft: '3px solid #7c3aed' },
                        { top: '20%', right: '10%', borderTop: '3px solid #7c3aed', borderRight: '3px solid #7c3aed' },
                        { bottom: '20%', left: '10%', borderBottom: '3px solid #7c3aed', borderLeft: '3px solid #7c3aed' },
                        { bottom: '20%', right: '10%', borderBottom: '3px solid #7c3aed', borderRight: '3px solid #7c3aed' }
                      ].map((corner, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: 24,
                            height: 24,
                            animation: 'cornerPulse 2s ease infinite',
                            ...corner
                          }}
                        />
                      ))}

                      <div
                        style={{
                          position: 'absolute',
                          left: '10%',
                          right: '10%',
                          height: 2,
                          background: 'linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)',
                          boxShadow: '0 0 8px #7c3aed',
                          animation: 'scanLine 2s ease-in-out infinite'
                        }}
                      />

                      <div
                        style={{
                          position: 'absolute',
                          bottom: '22%',
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                          color: 'white',
                          fontSize: 11,
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Насочете баркода към рамката
                      </div>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: 20,
                          padding: '4px 10px'
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 6px #22c55e',
                            animation: 'cornerPulse 1s ease infinite'
                          }}
                        />
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 500 }}>Камерата е активна</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCameraActive(false)}
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          border: 'none',
                          borderRadius: 20,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 500
                        }}
                      >
                        ✕ Спри
                      </button>
                    </div>
                  </div>

                  {lastScannedLabel && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}
                    >
                      Последен скан: {lastScannedLabel}
                    </div>
                  )}

                  {result?.ok === null && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 12px',
                        background: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#854d0e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>⏳</span> Обработване...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {result && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 16px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: result.ok === null ? '#fefce8' : result.ok ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.ok === null ? '#fde047' : result.ok ? '#bbf7d0' : '#fecaca'}`
              }}
            >
              <span style={{ fontSize: 18 }}>{result.ok === null ? '⏳' : result.ok ? '✅' : '❌'}</span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: result.ok === null ? '#854d0e' : result.ok ? '#15803d' : '#dc2626'
                  }}
                >
                  {result.message}
                </div>
                {result.product && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Наличност: {result.product.totalStock} {result.product.unit} · Цена: {result.product.price ?? '—'} лв.
                  </div>
                )}
              </div>
            </div>
          )}

          {scanning && (
            <div style={{ textAlign: 'center', padding: 12, color: '#7c3aed', fontSize: 13 }}>Търсене...</div>
          )}
        </div>
      </div>
    </div>
  )
}
