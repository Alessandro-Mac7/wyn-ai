'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, CameraOff, AlertTriangle } from 'lucide-react'
import { extractVenueSlug } from '@/lib/qr-scanner'
import { cn } from '@/lib/utils'

interface QrScannerProps {
  onScanSuccess: (slug: string) => void
  onClose?: () => void
}

type ScannerState = 'loading' | 'scanning' | 'permission_denied' | 'error'

export function QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const [state, setState] = useState<ScannerState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [invalidQr, setInvalidQr] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasScannedRef = useRef(false)

  const handleScan = useCallback((decodedText: string) => {
    if (hasScannedRef.current) return

    const slug = extractVenueSlug(decodedText)
    if (slug) {
      hasScannedRef.current = true

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      onScanSuccess(slug)
    } else {
      // Show invalid QR toast briefly
      setInvalidQr(true)
      setTimeout(() => setInvalidQr(false), 3000)
    }
  }, [onScanSuccess])

  useEffect(() => {
    let mounted = true

    async function startScanner() {
      try {
        // Dynamic import to avoid bundling in initial load
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!mounted || !containerRef.current) return

        const scannerId = 'wyn-qr-scanner'

        // Create scanner element if not exists
        let scannerEl = containerRef.current.querySelector(`#${scannerId}`)
        if (!scannerEl) {
          scannerEl = document.createElement('div')
          scannerEl.id = scannerId
          containerRef.current.appendChild(scannerEl)
        }

        const html5Qr = new Html5Qrcode(scannerId)

        await html5Qr.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (mounted) handleScan(decodedText)
          },
          () => {
            // Ignore scan failures (no QR in frame)
          }
        )

        if (mounted) {
          scannerRef.current = html5Qr
          setState('scanning')
        } else {
          await html5Qr.stop()
        }
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : String(err)

        if (message.includes('Permission') || message.includes('NotAllowed')) {
          setState('permission_denied')
        } else {
          setState('error')
          setErrorMessage(message)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [handleScan])

  // Permission denied
  if (state === 'permission_denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <CameraOff className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Accesso alla camera negato</p>
          <p className="text-xs text-muted-foreground">
            Per scansionare il QR code del ristorante, consenti l&apos;accesso alla camera nelle impostazioni del browser.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-wine hover:text-wine-light transition-colors"
          >
            Chiudi
          </button>
        )}
      </div>
    )
  }

  // Generic error
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Errore scanner</p>
          <p className="text-xs text-muted-foreground">
            {errorMessage || 'Impossibile avviare la camera. Riprova.'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-wine hover:text-wine-light transition-colors"
          >
            Chiudi
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Camera viewport */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden',
          'bg-black/50',
          '[&_video]:rounded-2xl'
        )}
      />

      {/* Loading overlay */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Camera className="h-8 w-8 text-wine" />
          </motion.div>
          <p className="text-xs text-muted-foreground">Avvio camera...</p>
        </div>
      )}

      {/* Instructions */}
      {state === 'scanning' && (
        <p className="text-sm text-muted-foreground text-center">
          Inquadra il QR code del ristorante
        </p>
      )}

      {/* Invalid QR toast */}
      {invalidQr && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 left-4 right-4 py-2.5 px-4 rounded-xl bg-destructive/90 text-white text-sm text-center"
        >
          Non è un QR code WYN
        </motion.div>
      )}
    </div>
  )
}
