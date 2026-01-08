'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Wine, X, ArrowRight, AlertCircle, Loader2, Navigation, MapPinOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { overlayVariants, modalVariants } from '@/lib/motion'
import {
  getCurrentPosition,
  fetchNearbyVenues,
  fetchMaxVenueDistance,
  formatDistance,
  DEFAULT_MAX_VENUE_DISTANCE_KM,
  DEFAULT_SEARCH_RADIUS_KM,
} from '@/lib/geolocation'
import type { Venue, VenueWithDistance } from '@/types'

interface VenueSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (slug: string) => void
  recentVenues?: Venue[]
}

type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export function VenueSelector({
  isOpen,
  onClose,
  onSelect,
  recentVenues = [],
}: VenueSelectorProps) {
  const [venueCode, setVenueCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Geolocation state
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyVenues, setNearbyVenues] = useState<VenueWithDistance[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [maxVenueDistance, setMaxVenueDistance] = useState<number>(DEFAULT_MAX_VENUE_DISTANCE_KM)

  // Fetch settings and request geolocation when modal opens
  useEffect(() => {
    if (isOpen && locationStatus === 'idle') {
      // Fetch max distance setting
      fetchMaxVenueDistance().then(setMaxVenueDistance)
      requestLocation()
    }
  }, [isOpen, locationStatus])

  // Fetch nearby venues when position is available and settings loaded
  useEffect(() => {
    if (userPosition && locationStatus === 'granted' && maxVenueDistance > 0) {
      loadNearbyVenues()
    }
  }, [userPosition, locationStatus, maxVenueDistance])

  const requestLocation = async () => {
    setLocationStatus('requesting')

    try {
      const position = await getCurrentPosition()
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setLocationStatus('granted')
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied')
        } else {
          setLocationStatus('error')
        }
      } else {
        setLocationStatus('error')
      }
    }
  }

  const loadNearbyVenues = useCallback(async () => {
    if (!userPosition || maxVenueDistance <= 0) return

    setLoadingNearby(true)
    // Use configured max distance as the search radius
    const result = await fetchNearbyVenues(
      userPosition.lat,
      userPosition.lng,
      maxVenueDistance
    )
    setNearbyVenues(result.venues as VenueWithDistance[])
    setLoadingNearby(false)
  }, [userPosition, maxVenueDistance])

  // Validate venue and check distance
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

      const venueData = await response.json()

      // Check distance if we have user position, venue has coordinates, and distance check is enabled
      if (userPosition && venueData.venue?.latitude && venueData.venue?.longitude && maxVenueDistance > 0) {
        const { calculateDistance } = await import('@/lib/geolocation')
        const distance = calculateDistance(
          userPosition.lat,
          userPosition.lng,
          venueData.venue.latitude,
          venueData.venue.longitude
        )

        if (distance > maxVenueDistance) {
          setError(`Questo locale è troppo lontano (${formatDistance(distance)}). Devi essere entro ${maxVenueDistance} km dal ristorante.`)
          setIsValidating(false)
          return
        }
      }

      // Venue exists and is within range, proceed
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

  const handleSelectNearbyVenue = (venue: VenueWithDistance) => {
    // Nearby venues are already within range, select directly
    onSelect(venue.slug)
    setVenueCode('')
    setError(null)
  }

  const handleSelectRecentVenue = async (slug: string) => {
    // Recent venues need distance validation if we have user position
    if (userPosition) {
      await validateAndSelect(slug)
    } else {
      // No location, allow selection (venue might not have coordinates anyway)
      onSelect(slug)
      setVenueCode('')
      setError(null)
    }
  }

  const handleClose = () => {
    setVenueCode('')
    setError(null)
    onClose()
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setVenueCode('')
    }
  }, [isOpen])

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
              className="relative w-full max-w-md bg-card border border-border rounded-xl overflow-hidden max-h-[85vh] flex flex-col"
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

              {/* Content - scrollable */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                {/* Location status indicator */}
                {locationStatus === 'requesting' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rilevamento posizione...</span>
                  </div>
                )}

                {locationStatus === 'denied' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-900/20 text-yellow-400 rounded-lg text-sm">
                    <MapPinOff className="h-4 w-4 flex-shrink-0" />
                    <span>Posizione non disponibile. Inserisci il codice manualmente.</span>
                  </div>
                )}

                {/* Nearby venues section */}
                {locationStatus === 'granted' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="h-4 w-4 text-wine" />
                      <p className="text-sm font-medium">Locali vicino a te</p>
                    </div>

                    {loadingNearby ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : nearbyVenues.length > 0 ? (
                      <div className="space-y-1">
                        {nearbyVenues.map((venue) => (
                          <button
                            key={venue.slug}
                            onClick={() => handleSelectNearbyVenue(venue)}
                            disabled={isValidating}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-lg',
                              'hover:bg-secondary transition-colors text-left',
                              'disabled:opacity-50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Wine className="h-4 w-4 text-wine" />
                              <div>
                                <span className="text-sm font-medium">{venue.name}</span>
                                {venue.city && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {venue.city}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistance(venue.distance)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        Nessun locale trovato nelle vicinanze.
                      </p>
                    )}
                  </div>
                )}

                {/* Divider - only show if there are nearby venues */}
                {nearbyVenues.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">oppure</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {/* Search/Code input */}
                <form onSubmit={handleSubmit}>
                  <label className="text-sm font-medium mb-2 block">
                    Inserisci codice ristorante
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={venueCode}
                      onChange={(e) => {
                        setVenueCode(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder="es. osteria-del-vino"
                      disabled={isValidating}
                      className={cn(
                        'w-full h-11 pl-10 pr-12 rounded-lg',
                        'bg-secondary border-0 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-wine',
                        'placeholder:text-muted-foreground',
                        'disabled:opacity-50',
                        error && 'ring-2 ring-destructive'
                      )}
                      autoFocus={locationStatus !== 'requesting'}
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
                          onClick={() => handleSelectRecentVenue(venue.slug)}
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
