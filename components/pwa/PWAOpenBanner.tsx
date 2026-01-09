// components/pwa/PWAOpenBanner.tsx
// Smart banner that appears when user scans QR but PWA is installed

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X } from 'lucide-react'
import { isPWAInstalled, isInBrowser, setPendingVenue } from '@/lib/venue-flow'
import { haptic } from '@/lib/haptics'

interface PWAOpenBannerProps {
  venueSlug: string | null
  isFromQR: boolean
}

export function PWAOpenBanner({ venueSlug, isFromQR }: PWAOpenBannerProps) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only show if:
    // 1. Came from QR scan
    // 2. Currently in browser (not PWA)
    // 3. Not dismissed this session
    if (isFromQR && !dismissed) {
      // Check after a brief delay to ensure window is available
      const timer = setTimeout(() => {
        const inBrowser = isInBrowser()
        const pwaInstalled = isPWAInstalled()

        // Show banner if we're in browser (not PWA)
        // Note: We can't reliably detect if PWA is installed from browser on iOS
        // So we show the banner for all QR scans from browser and let user decide
        setShow(inBrowser && !pwaInstalled)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isFromQR, dismissed])

  const handleOpenInApp = () => {
    haptic.medium()
    if (venueSlug) {
      setPendingVenue(venueSlug)
    }

    // Try to open PWA (works on some browsers, not iOS Safari)
    try {
      // Attempt to open PWA by opening the root URL
      // This will only work if the PWA is already installed
      window.open('/', '_blank')

      // Show instructions as fallback for iOS
      setTimeout(() => {
        alert('Per aprire WYN:\n\n1. Torna alla home del tuo telefono\n2. Tocca l\'icona WYN\n3. Il locale sarà caricato automaticamente')
      }, 300)
    } catch (error) {
      console.error('Failed to open PWA:', error)
      alert('Per aprire WYN, torna alla home e tocca l\'icona WYN')
    }

    setDismissed(true)
  }

  const handleDismiss = () => {
    haptic.light()
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="sticky top-0 z-50 px-4 py-2.5 bg-wine/10 border-b border-wine/20 backdrop-blur-md"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <Image
                src="/wyn-icon.ico"
                alt="WYN"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <p className="text-sm font-medium">Hai installato WYN?</p>
                <p className="text-xs text-muted-foreground">Apri l&apos;app per un&apos;esperienza migliore</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenInApp}
                className="px-3 py-1.5 bg-wine text-white text-sm font-medium rounded-lg hover:bg-wine-dark transition-colors"
              >
                Apri
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
