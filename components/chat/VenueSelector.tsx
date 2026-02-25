'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Wine, X, ArrowRight, AlertCircle, AlertTriangle, Loader2, Navigation, MapPinOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegisterPanel } from '@/contexts/panel-context'
import { panelSlideVariants, backdropVariants } from '@/lib/motion'
import {
  getCurrentPosition,
  fetchNearbyVenues,
  fetchMaxVenueDistance,
  formatDistance,
  DEFAULT_MAX_VENUE_DISTANCE_KM,
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
  // Register panel for z-index coordination
  useRegisterPanel('venue-selector', isOpen)

  const [venueCode, setVenueCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distanceWarning, setDistanceWarning] = useState<{
    venueName: string
    venueSlug: string
    distance: number
    maxDistance: number
  } | null>(null)

  // Geolocation state
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyVenues, setNearbyVenues] = useState<VenueWithDistance[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [maxVenueDistance, setMaxVenueDistance] = useState<number>(DEFAULT_MAX_VENUE_DISTANCE_KM)

  // Fetch settings and request geolocation when panel opens
  useEffect(() => {
    if (isOpen && locationStatus === 'idle') {
      fetchMaxVenueDistance().then(setMaxVenueDistance)
      requestLocation()
    }
  }, [isOpen, locationStatus])

  const requestLocation = async () => {
    setLocationStatus('requesting')

    try {
      const position = await getCurrentPosition()
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setLocationStatus('granted')
    } catch (err: unknown) {
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
    const result = await fetchNearbyVenues(
      userPosition.lat,
      userPosition.lng,
      maxVenueDistance
    )
    setNearbyVenues(result.venues as VenueWithDistance[])
    setLoadingNearby(false)
  }, [userPosition, maxVenueDistance])

  // Fetch nearby venues when position is available and settings loaded
  useEffect(() => {
    if (userPosition && locationStatus === 'granted' && maxVenueDistance > 0) {
      loadNearbyVenues()
    }
  }, [userPosition, locationStatus, maxVenueDistance, loadNearbyVenues])

  // Validate venue exists and select it (with optional distance warning)
  const validateAndSelect = async (slug: string, skipWarning = false) => {
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

      // Show distance warning (not blocking) if user is far from venue
      if (!skipWarning && userPosition && venueData.venue?.latitude && venueData.venue?.longitude && maxVenueDistance > 0) {
        const { calculateDistance } = await import('@/lib/geolocation')
        const distance = calculateDistance(
          userPosition.lat,
          userPosition.lng,
          venueData.venue.latitude,
          venueData.venue.longitude
        )

        if (distance > maxVenueDistance) {
          // Show warning but allow user to proceed
          setDistanceWarning({
            venueName: venueData.venue.name,
            venueSlug: slug,
            distance: distance,
            maxDistance: maxVenueDistance,
          })
          setIsValidating(false)
          return
        }
      }

      // Proceed with selection
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
    // Nearby venues are already within configured range
    onSelect(venue.slug)
    setVenueCode('')
    setError(null)
  }

  // User confirms they want to proceed despite distance warning
  const handleConfirmDistanceWarning = () => {
    if (distanceWarning) {
      onSelect(distanceWarning.venueSlug)
      setVenueCode('')
      setError(null)
      setDistanceWarning(null)
    }
  }

  const handleCancelDistanceWarning = () => {
    setDistanceWarning(null)
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

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setVenueCode('')
      setDistanceWarning(null)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] glass-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className={cn(
              'fixed inset-y-0 right-0 z-[70] safe-top safe-bottom',
              'w-full sm:w-[380px] max-w-full',
              'glass-panel',
              'flex flex-col'
            )}
            variants={panelSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-selector-title"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <MapPin className="h-4 w-4 text-wine" />
                </div>
                <h2 id="venue-selector-title" className="text-base font-semibold">
                  Seleziona Locale
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 glass-hover rounded-lg"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
              {/* Location status indicator */}
              {locationStatus === 'requesting' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rilevamento posizione...</span>
                </div>
              )}

              {locationStatus === 'denied' && (
                <div className="flex items-center gap-2 p-3 bg-status-warning/10 text-status-warning rounded-lg text-sm">
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
                            'glass-hover transition-colors text-left',
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
                      'w-full h-11 pl-10 pr-12 glass-input text-sm',
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

              {/* Distance warning (non-blocking) */}
              <AnimatePresence>
                {distanceWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-status-warning">
                          Locale distante
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>{distanceWarning.venueName}</strong> si trova a {formatDistance(distanceWarning.distance)} dalla tua posizione.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleConfirmDistanceWarning}
                            className="px-3 py-1.5 text-sm bg-wine hover:bg-wine-dark text-white rounded-md transition-colors"
                          >
                            Continua comunque
                          </button>
                          <button
                            onClick={handleCancelDistanceWarning}
                            className="px-3 py-1.5 text-sm glass-badge glass-hover rounded-md"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                          'glass-hover transition-colors text-left',
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
