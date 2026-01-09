'use client'

import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Printer, Copy, X, Check } from 'lucide-react'
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-md',
              '-translate-x-1/2 -translate-y-1/2',
              'bg-card rounded-xl shadow-2xl border border-border',
              'overflow-hidden'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
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
              <div className="flex gap-3 mt-6 w-full">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Scarica
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Stampa
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copiato!' : 'Copia'}
                </Button>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground text-center">
                I clienti possono scansionare questo QR code per accedere
                direttamente alla chat con il sommelier AI.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
