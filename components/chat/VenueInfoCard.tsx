'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { Venue } from '@/types'

interface VenueInfoCardProps {
  venue: Venue
  isExpanded: boolean
}

// Animation variants for expand/collapse
const infoCardVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const }
  }
} as const

export function VenueInfoCard({ venue, isExpanded }: VenueInfoCardProps) {

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className="overflow-hidden bg-card/50 border-b border-border"
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={infoCardVariants}
        >
          <div className="px-4 py-3 max-w-3xl mx-auto">
            {/* Description */}
            {venue.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {venue.description}
              </p>
            )}

            {/* Address and City */}
            {(venue.address || venue.city) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-wine" />
                <span>
                  {venue.address}
                  {venue.address && venue.city && ', '}
                  {venue.city}
                </span>
              </div>
            )}

            {/* Fallback if no info */}
            {!venue.description && !venue.address && !venue.city && (
              <p className="text-sm text-muted-foreground italic">
                Nessuna informazione disponibile per questo locale.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
