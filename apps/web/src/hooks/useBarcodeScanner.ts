import { useEffect, useRef, useState } from 'react'

interface UseBarcodeOptions {
  onScan: (barcode: string) => void
  minLength?: number
  timeout?: number
  active?: boolean
}

// USB barcode scanners type very fast (< 50ms between chars).
// This hook detects that pattern vs normal keyboard typing.
export function useBarcodeScannerInput({
  onScan,
  minLength = 3,
  timeout = 150,
  active = true
}: UseBarcodeOptions) {
  const buffer = useRef('')
  const lastKey = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!active) return

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key.length > 1 && e.key !== 'Enter') return

      const now = Date.now()

      if (e.key === 'Enter') {
        if (buffer.current.length >= minLength) {
          onScan(buffer.current)
        }
        buffer.current = ''
        lastKey.current = 0
        return
      }

      if (buffer.current.length > 0 && now - lastKey.current > 50) {
        buffer.current = ''
      }

      buffer.current += e.key
      lastKey.current = now

      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        if (buffer.current.length >= minLength) {
          onScan(buffer.current)
        }
        buffer.current = ''
      }, timeout)
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      clearTimeout(timer.current)
    }
  }, [active, onScan, minLength, timeout])
}

// Camera scanner requires: pnpm --filter @dflow/web add @ericblade/quagga2
// Optional — USB scanner works without it
export function useCameraScanner({
  onScan,
  active = false,
  elementId = 'camera-preview'
}: {
  onScan: (barcode: string) => void
  active?: boolean
  elementId?: string
}) {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)
  }, [])

  useEffect(() => {
    if (!active || !supported) return

    let Quagga: any = null
    let stopped = false

    const start = async () => {
      try {
        const mod = await import('@ericblade/quagga2')
        Quagga = mod.default
      } catch {
        console.warn('quagga2 not installed — camera scanner unavailable')
        return
      }
      if (stopped) return

      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target: document.getElementById(elementId),
            constraints: { facingMode: 'environment', width: 640, height: 480 }
          },
          decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader'] }
        },
        (err: any) => {
          if (err) {
            console.error('Camera scanner init error:', err)
            return
          }
          Quagga.start()
        }
      )

      Quagga.onDetected((result: any) => {
        const code = result?.codeResult?.code
        if (code) onScan(code)
      })
    }

    start()
    return () => {
      stopped = true
      if (Quagga) {
        try {
          Quagga.stop()
        } catch {
          /* ignore */
        }
      }
    }
  }, [active, supported, elementId, onScan])

  return { supported }
}
