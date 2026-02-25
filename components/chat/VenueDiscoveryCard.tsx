'use client'

import { MapPin, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { VenueDiscoveryResult } from '@/app/api/venues/discover/route'

// ============================================
// TYPES
// ============================================

interface VenueDiscoveryCardProps {
  venues: VenueDiscoveryResult[]
  onVenueSelect: (slug: string) => void
  onDismiss: () => void
}

// ============================================
// COMPONENT
// ============================================

export function VenueDiscoveryCard({
  venues,
  onVenueSelect,
  onDismiss,
}: VenueDiscoveryCardProps) {
  if (venues.length === 0) {
    return null
  }

  // Show max 3 venues
  const displayVenues = venues.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative w-full rounded-lg border border-wine/30 bg-card-bg p-4 shadow-lg"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-wine" />
          <h3 className="text-sm font-semibold text-white">
            Disponibile presso locali WYN
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-secondary hover:bg-wine/10 hover:text-wine transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Venue List */}
      <div className="space-y-2">
        {displayVenues.map((venue) => (
          <button
            key={venue.venue_id}
            onClick={() => onVenueSelect(venue.venue_slug)}
            className="w-full rounded-md border border-wine/20 bg-primary-bg p-3 text-left transition-colors hover:border-wine/40 hover:bg-wine/5"
          >
            {/* Venue Name */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="font-semibold text-white">{venue.venue_name}</h4>
              {venue.distance_km !== undefined && (
                <span className="whitespace-nowrap text-xs text-secondary">
                  {venue.distance_km.toFixed(1)} km
                </span>
              )}
            </div>

            {/* Wine Info */}
            <div className="mb-1 text-sm text-secondary">
              {venue.best_match_wine}
              {venue.best_match_producer && (
                <span className="text-secondary/70"> • {venue.best_match_producer}</span>
              )}
            </div>

            {/* Price */}
            {venue.best_match_price !== null && (
              <div className="text-sm font-medium text-wine">
                €{venue.best_match_price.toFixed(2)}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer hint */}
      {venues.length > 3 && (
        <p className="mt-2 text-xs text-secondary/70">
          +{venues.length - 3} altri locali disponibili
        </p>
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="mt-3 w-full rounded-md border border-wine/20 py-2 text-sm text-secondary transition-colors hover:border-wine/40 hover:text-wine"
      >
        Chiudi
      </button>
    </motion.div>
  )
}
