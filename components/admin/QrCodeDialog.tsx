'use client'

import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Printer, Copy, X, Check, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getVenueChatUrl,
  downloadQrCode,
  printQrCode,
  copyToClipboard,
} from '@/lib/qr-utils'

interface QrCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  venue: {
    slug: string
    name: string
  }
}

// Slide-in panel animation variants (matching VenueSelector/WineSidebar pattern)
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 }
  }
} as const

const panelVariants = {
  hidden: {
    x: '100%',
    opacity: 0.8
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1] as const
    }
  }
}

export function QrCodeDialog({ isOpen, onClose, venue }: QrCodeDialogProps) {
  const [copied, setCopied] = useState(false)

  const venueUrl = getVenueChatUrl(venue.slug)

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-canvas') as HTMLCanvasElement
    if (canvas) {
      downloadQrCode(canvas, venue.slug)
    }
  }

  const handlePrint = () => {
    const canvas = document.querySelector('#qr-canvas') as HTMLCanvasElement
    if (canvas) {
      const imageData = canvas.toDataURL('image/png')
      printQrCode(imageData, venue.name, venueUrl)
    }
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(venueUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className={cn(
              'fixed inset-y-0 right-0 z-[70]',
              'w-full sm:w-[380px] max-w-full',
              'bg-card border-l border-border',
              'flex flex-col',
              'shadow-[-8px_0_32px_rgba(0,0,0,0.3)]'
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-code-title"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <QrCode className="h-4 w-4 text-wine" />
                </div>
                <h2 id="qr-code-title" className="text-base font-semibold">
                  QR Code
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <div className="flex flex-col items-center">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeCanvas
                    id="qr-canvas"
                    value={venueUrl}
                    size={256}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                {/* Venue Info */}
                <div className="mt-4 text-center">
                  <h3 className="font-medium text-lg">{venue.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 break-all">
                    {venueUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-6 w-full">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Scarica PNG
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                    Stampa
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copiato!' : 'Copia URL'}
                  </Button>
                </div>

                {/* Footer Tip */}
                <div className="mt-6 p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    I clienti possono scansionare questo QR code per accedere
                    direttamente alla chat con il sommelier AI.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
