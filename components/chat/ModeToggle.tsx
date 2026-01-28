'use client'

import { motion } from 'framer-motion'
import { MessageCircle, MapPin, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModeToggleProps {
  isVenueMode: boolean
  venueName?: string
  onSelectVenue: () => void
  onCloseVenue: () => void
  onClearVenue?: () => void
}

export function ModeToggle({ isVenueMode, venueName, onSelectVenue, onCloseVenue, onClearVenue }: ModeToggleProps) {
  return (
    <div className="relative inline-flex items-center rounded-full glass-ios-subtle p-0.5">
      {/* Chat button */}
      <button
        onClick={() => { if (isVenueMode) onCloseVenue() }}
        className={cn(
          'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]',
          !isVenueMode ? 'text-white' : 'text-muted-foreground'
        )}
      >
        {!isVenueMode && (
          <motion.div
            layoutId="mode-pill"
            className="absolute inset-0 bg-wine rounded-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <MessageCircle className="h-3.5 w-3.5 relative z-10" />
        <span className="relative z-10">Chat</span>
      </button>

      {/* Locale button */}
      <button
        onClick={() => { if (!isVenueMode) onSelectVenue() }}
        className={cn(
          'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]',
          isVenueMode ? 'text-white' : 'text-muted-foreground'
        )}
      >
        {isVenueMode && (
          <motion.div
            layoutId="mode-pill"
            className="absolute inset-0 bg-wine rounded-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        {isVenueMode ? (
          <>
            <Check className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10 max-w-[80px] truncate">{venueName || 'Locale'}</span>
          </>
        ) : (
          <>
            <MapPin className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10">Locale</span>
          </>
        )}
      </button>

      {/* X button — clears venue entirely and reopens selector */}
      {isVenueMode && onClearVenue && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClearVenue()
          }}
          className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors mr-0.5"
          aria-label="Cambia locale"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
