'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Info, BookOpen, Check, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Venue } from '@/types'

interface WineStats {
  total: number
  types: number
  byType: {
    red: number
    white: number
    rose: number
    sparkling: number
    dessert: number
  }
}

interface VenueHeaderProps {
  venue: Venue
  wineStats?: WineStats
  onClose: () => void
  onInfoToggle?: () => void
  onWineMenuToggle?: () => void
  isInfoExpanded?: boolean
  isFromQR?: boolean
}

export function VenueHeader({
  venue,
  wineStats,
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
      className="shrink-0 z-20 mx-3 sm:mx-auto mt-2 mb-3 sm:max-w-md lg:max-w-lg"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
    >
      <div className="rounded-2xl glass-ios px-4 py-2.5">
        {/* Venue name — centered */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="h-3.5 w-3.5 text-wine shrink-0" />
          <h1 className="mina-regular text-base sm:text-lg uppercase truncate text-center">
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

        {/* Action pills — centered row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Info button */}
          {onInfoToggle && (
            <button
              onClick={onInfoToggle}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors btn-press",
                isInfoExpanded
                  ? "bg-wine/20 border-wine text-wine"
                  : "border-white/10 hover:border-wine/50 text-muted-foreground hover:text-foreground"
              )}
              aria-label={isInfoExpanded ? "Nascondi info" : "Mostra info"}
              aria-expanded={isInfoExpanded}
            >
              <Info className="h-3.5 w-3.5" />
              Info
            </button>
          )}

          {/* Wine menu button */}
          {onWineMenuToggle && (
            <button
              onClick={onWineMenuToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-wine/50 text-xs font-medium transition-colors btn-press text-muted-foreground hover:text-foreground"
              aria-label="Apri carta dei vini"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Carta
              {wineStats && (
                <span className="text-wine font-semibold">{wineStats.total}</span>
              )}
            </button>
          )}

          {/* Wine type counts */}
          {wineStats && wineStats.byType && (
            <>
              {wineStats.byType.red > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                  <Wine className="h-3 w-3" />
                  {wineStats.byType.red}
                </span>
              )}
              {wineStats.byType.white > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                  <Wine className="h-3 w-3" />
                  {wineStats.byType.white}
                </span>
              )}
              {wineStats.byType.rose > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs">
                  <Wine className="h-3 w-3" />
                  {wineStats.byType.rose}
                </span>
              )}
              {wineStats.byType.sparkling > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">
                  <Wine className="h-3 w-3" />
                  {wineStats.byType.sparkling}
                </span>
              )}
              {wineStats.byType.dessert > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs">
                  <Wine className="h-3 w-3" />
                  {wineStats.byType.dessert}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
