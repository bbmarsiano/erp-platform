import { useEffect, useRef, useState } from 'react'

// USB barcode scanner hook — works with any keyboard-wedge USB/Bluetooth scanner
interface UseBarcodeOptions {
  onScan: (barcode: string) => void
  minLength?: number
  timeout?: number
  active?: boolean
}

export function useBarcodeScannerInput({
  onScan,
  minLength = 3,
  timeout = 150,
  active = true
}: UseBarcodeOptions) {
  const buffer = useRef('')
  const lastKey = useRef<number>(0)
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

// Camera scanner hook using quagga2
export function useCameraScanner({
  onScan,
  active = false,
  elementId = 'barcode-camera-preview'
}: {
  onScan: (barcode: string) => void
  active?: boolean
  elementId?: string
}) {
  const [supported, setSupported] = useState(false)
  const quaggaRef = useRef<any>(null)

  useEffect(() => {
    setSupported(
      typeof navigator !== 'undefined' &&
        'mediaDevices' in navigator &&
        'getUserMedia' in navigator.mediaDevices
    )
  }, [])

  useEffect(() => {
    if (!active || !supported) return

    let stopped = false

    const initQuagga = async () => {
      try {
        const Quagga = (await import('@ericblade/quagga2')).default
        if (stopped) return
        quaggaRef.current = Quagga

        await new Promise<void>((resolve, reject) => {
          Quagga.init(
            {
              inputStream: {
                type: 'LiveStream',
                target: document.getElementById(elementId) as HTMLElement,
                constraints: {
                  facingMode: 'environment',
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }
              },
              locator: { patchSize: 'medium', halfSample: true },
              numOfWorkers: 2,
              frequency: 10,
              decoder: {
                readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader']
              },
              locate: true
            },
            (err: any) => {
              if (err) {
                reject(err)
                return
              }
              resolve()
            }
          )
        })

        if (stopped) return
        Quagga.start()

        Quagga.onDetected((result: any) => {
          const code = result?.codeResult?.code
          if (code) onScan(code)
        })
      } catch (err) {
        console.error('Camera scanner error:', err)
      }
    }

    initQuagga()

    return () => {
      stopped = true
      if (quaggaRef.current) {
        try {
          quaggaRef.current.stop()
          quaggaRef.current = null
        } catch {
          /* ignore */
        }
      }
    }
  }, [active, supported, elementId, onScan])

  return { supported }
}
