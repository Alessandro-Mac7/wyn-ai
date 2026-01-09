'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Info, BookOpen, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Venue } from '@/types'

interface VenueHeaderProps {
  venue: Venue
  wineStats?: { total: number; types: number }
  onClose: () => void
  onInfoToggle?: () => void
  onWineMenuToggle?: () => void
  isInfoExpanded?: boolean
  isFromQR?: boolean
}

export function VenueHeader({
  venue,
  wineStats,
  onClose,
  onInfoToggle,
  onWineMenuToggle,
  isInfoExpanded,
  isFromQR,
}: VenueHeaderProps) {
  const [showQRBadge, setShowQRBadge] = useState(isFromQR)

  // Auto-hide QR badge after 3 seconds
  useEffect(() => {
    if (isFromQR) {
      setShowQRBadge(true)
      const timer = setTimeout(() => setShowQRBadge(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isFromQR])

  return (
    <motion.header
      className="shrink-0 z-20 glass shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
    >
      <div className="px-3 sm:px-4 py-2.5">
        {/* Single row: Venue name + action buttons */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Venue name with badge */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="h-4 w-4 text-wine shrink-0" />
            <h1 className="mina-regular text-base sm:text-lg uppercase truncate">
              {venue.name}
            </h1>
            <AnimatePresence>
              {showQRBadge && (
                <motion.span
                  className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                    opacity: { duration: 0.3 }
                  }}
                >
                  <Check className="h-3 w-3 text-green-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Info button */}
            {onInfoToggle && (
              <button
                onClick={onInfoToggle}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors btn-press text-sm",
                  isInfoExpanded
                    ? "bg-wine/20 text-wine"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
                aria-label={isInfoExpanded ? "Nascondi info" : "Mostra info"}
                aria-expanded={isInfoExpanded}
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Info</span>
              </button>
            )}

            {/* Wine menu button */}
            {onWineMenuToggle && (
              <button
                onClick={onWineMenuToggle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-secondary rounded-lg transition-colors btn-press text-muted-foreground hover:text-foreground text-sm"
                aria-label="Apri carta dei vini"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium">Carta</span>
                {wineStats && (
                  <span className="text-xs text-wine font-semibold">{wineStats.total}</span>
                )}
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors btn-press"
              aria-label="Esci dal locale"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
