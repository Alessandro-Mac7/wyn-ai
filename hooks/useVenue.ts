'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from '@/contexts/session-context'
import type { Venue, WineType, WineWithRatings } from '@/types'

interface UseVenueReturn {
  venue: ReturnType<typeof useSession>['venueData']
  wines: WineWithRatings[]
  isLoading: boolean
  error: string | null
  wineStats: { total: number; types: number } | null
  loadVenue: (slug: string) => Promise<void>
  clearVenue: () => void
}

export function useVenue(): UseVenueReturn {
  // Get venue data from session context
  const { venueData, venueSlug, setVenue } = useSession()

  // Transient state (not persisted)
  const [wines, setWines] = useState<WineWithRatings[]>([])
  const [wineStats, setWineStats] = useState<{ total: number; types: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVenue = useCallback(async (slug: string) => {
    // Return cached if same venue
    if (venueSlug === slug && venueData) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch venue info
      const response = await fetch(`/api/venue/${slug}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Locale non trovato')
        }
        throw new Error('Errore nel caricamento del locale')
      }

      const data = await response.json()

      // Update session with venue data
      setVenue(data.venue)

      // Store wines and calculate wine stats
      if (data.wines) {
        setWines(data.wines)
        const types = new Set<WineType>()
        data.wines.forEach((wine: { wine_type: WineType }) => types.add(wine.wine_type))
        setWineStats({
          total: data.wines.length,
          types: types.size,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setVenue(null)
      setWines([])
      setWineStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [venueSlug, venueData, setVenue])

  const clearVenue = useCallback(() => {
    setVenue(null)
    setWines([])
    setWineStats(null)
    setError(null)
  }, [setVenue])

  return { venue: venueData, wines, isLoading, error, wineStats, loadVenue, clearVenue }
}

// LocalStorage key for recent venues
const RECENT_VENUES_KEY = 'wyn_recent_venues'
const MAX_RECENT_VENUES = 5

export function useRecentVenues() {
  const [recentVenues, setRecentVenues] = useState<Venue[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_VENUES_KEY)
      if (stored) {
        setRecentVenues(JSON.parse(stored))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const addRecentVenue = useCallback((venue: Venue) => {
    setRecentVenues((prev) => {
      // Remove if already exists, add to front
      const filtered = prev.filter((v) => v.slug !== venue.slug)
      const updated = [venue, ...filtered].slice(0, MAX_RECENT_VENUES)

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_VENUES_KEY, JSON.stringify(updated))
      } catch {
        // Ignore localStorage errors
      }

      return updated
    })
  }, [])

  return { recentVenues, addRecentVenue }
}
