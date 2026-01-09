'use client'

import { motion } from 'framer-motion'
import { MapPin, ChevronRight, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VenueSelectionBarProps {
  onSelectVenue: () => void
}

export function VenueSelectionBar({ onSelectVenue }: VenueSelectionBarProps) {
  return (
    <motion.header
      className="shrink-0 z-20 glass shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
    >
      <div className="px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Mode indicator */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-secondary border border-border">
              <MessageCircle className="h-3 w-3" />
              Chat Generale
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Consigli generici sul mondo del vino
            </span>
          </div>

          {/* Right side - Select venue button */}
          <motion.button
            onClick={onSelectVenue}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2',
              'text-sm font-medium rounded-lg',
              'bg-wine/10 hover:bg-wine/20 text-wine',
              'border border-wine/30 hover:border-wine/50',
              'transition-all duration-150'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Seleziona locale</span>
            <span className="sm:hidden">Locale</span>
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
