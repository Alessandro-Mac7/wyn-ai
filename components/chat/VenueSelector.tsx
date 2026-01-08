'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Wine, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { overlayVariants, modalVariants } from '@/lib/motion'
import type { Venue } from '@/types'

interface VenueSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (slug: string) => void
  recentVenues?: Venue[]
}

export function VenueSelector({
  isOpen,
  onClose,
  onSelect,
  recentVenues = [],
}: VenueSelectorProps) {
  const [venueCode, setVenueCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSelect = async (slug: string) => {
    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch(`/api/venue/${encodeURIComponent(slug)}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Locale non trovato. Controlla il codice e riprova.')
        } else {
          setError('Errore durante la ricerca. Riprova.')
        }
        setIsValidating(false)
        return
      }

      // Venue exists, proceed
      onSelect(slug)
      setVenueCode('')
      setError(null)
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (venueCode.trim() && !isValidating) {
      validateAndSelect(venueCode.trim().toLowerCase())
    }
  }

  const handleSelectVenue = (slug: string) => {
    // Recent venues are already validated, select directly
    onSelect(slug)
    setVenueCode('')
    setError(null)
  }

  const handleClose = () => {
    setVenueCode('')
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="relative w-full max-w-md bg-card border border-border rounded-xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="venue-selector-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                    <MapPin className="h-5 w-5 text-wine" />
                  </div>
                  <h2 id="venue-selector-title" className="text-lg font-semibold">
                    Seleziona Locale
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Search/Code input */}
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={venueCode}
                      onChange={(e) => {
                        setVenueCode(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder="Inserisci codice ristorante..."
                      disabled={isValidating}
                      className={cn(
                        'w-full h-11 pl-10 pr-12 rounded-lg',
                        'bg-secondary border-0 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-wine',
                        'placeholder:text-muted-foreground',
                        'disabled:opacity-50',
                        error && 'ring-2 ring-destructive'
                      )}
                      autoFocus
                    />
                    {venueCode.trim() && (
                      <button
                        type="submit"
                        disabled={isValidating}
                        className={cn(
                          'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors',
                          isValidating
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-wine text-white hover:bg-wine-dark'
                        )}
                        aria-label="Cerca"
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2 mt-2 text-sm text-destructive"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                {/* Recent venues */}
                {recentVenues.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Recenti</p>
                    <div className="space-y-1">
                      {recentVenues.map((venue) => (
                        <button
                          key={venue.slug}
                          onClick={() => handleSelectVenue(venue.slug)}
                          disabled={isValidating}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg',
                            'hover:bg-secondary transition-colors text-left',
                            'disabled:opacity-50'
                          )}
                        >
                          <Wine className="h-4 w-4 text-wine" />
                          <span className="text-sm">{venue.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
