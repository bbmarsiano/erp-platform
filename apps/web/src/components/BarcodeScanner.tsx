import { useState, useCallback } from 'react'
import { Scan, Camera, X, CheckCircle, AlertCircle } from 'lucide-react'
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

export function BarcodeScanner({ onProductFound, onClose, title = 'Баркод скенер' }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'usb' | 'camera'>('usb')
  const [cameraActive, setCameraActive] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string; product?: ScanResult } | null>(null)

  const handleScan = useCallback(
    async (barcode: string) => {
      if (scanning || barcode === lastScan) return
      setLastScan(barcode)
      setScanning(true)
      setResult(null)

      try {
        const resp = await api.get(`/api/wms/products/by-barcode/${encodeURIComponent(barcode)}`)
        const product = resp.data.data as ScanResult
        setResult({ ok: true, message: `Намерен: ${product.name}`, product })
        setTimeout(() => {
          onProductFound(product)
          setResult(null)
          setLastScan('')
        }, 800)
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Баркодът не е намерен в системата'
        setResult({ ok: false, message: msg })
        setTimeout(() => {
          setResult(null)
          setLastScan('')
        }, 2500)
      } finally {
        setScanning(false)
      }
    },
    [scanning, lastScan, onProductFound]
  )

  useBarcodeScannerInput({ onScan: handleScan, active: mode === 'usb' })

  const { supported: cameraSupported } = useCameraScanner({
    onScan: handleScan,
    active: mode === 'camera' && cameraActive,
    elementId: 'barcode-camera-preview'
  })

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
                    id="barcode-camera-preview"
                    style={{
                      width: '100%',
                      height: 240,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#000',
                      marginBottom: 10
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCameraActive(false)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Спри камерата
                  </button>
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
                background: result.ok ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`
              }}
            >
              {result.ok ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: result.ok ? '#15803d' : '#dc2626' }}>{result.message}</div>
                {result.product && (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Наличност: {result.product.totalStock} {result.product.unit}
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
