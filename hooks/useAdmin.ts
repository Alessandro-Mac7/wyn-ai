'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { useAuth } from '@/contexts/auth-context'
import type { WineWithRatings, WineCreateInput, WineUpdateInput } from '@/types'

interface AdminState {
  wines: WineWithRatings[]
  isLoadingWines: boolean
  error: string | null
}

export function useAdmin() {
  const [supabase] = useState(() => createSupabaseBrowserClient())

  // Use centralized auth context instead of duplicate state
  const { user, isLoading: isAuthLoading, roles, venue, signOut } = useAuth()

  const [state, setState] = useState<AdminState>({
    wines: [],
    isLoadingWines: false,
    error: null,
  })

  // Derived auth state from context
  const isAuthenticated = !!user && (roles.isSuperAdmin || roles.isVenueAdmin)
  const isSuperAdmin = roles.isSuperAdmin
  const isVenueAdmin = roles.isVenueAdmin

  const fetchWines = useCallback(async () => {
    if (!venue?.id) return

    setState((prev) => ({ ...prev, isLoadingWines: true }))

    try {
      // Fetch wines with ratings for the venue
      const { data: wines, error } = await supabase
        .from('wines')
        .select(`
          *,
          ratings:wine_ratings(*)
        `)
        .eq('venue_id', venue.id)
        .order('wine_type')
        .order('name')

      if (error) throw error

      setState((prev) => ({
        ...prev,
        wines: wines as WineWithRatings[],
        isLoadingWines: false,
      }))
    } catch (error) {
      console.error('Error fetching wines:', error)
      setState((prev) => ({
        ...prev,
        error: 'Failed to load wines',
        isLoadingWines: false,
      }))
    }
  }, [supabase, venue?.id])

  const addWine = useCallback(
    async (input: WineCreateInput) => {
      if (!venue?.id) {
        console.error('No venue ID available for adding wine')
        return null
      }

      try {
        const { data: wine, error } = await supabase
          .from('wines')
          .insert({
            venue_id: venue.id,
            name: input.name,
            wine_type: input.wine_type,
            price: input.price,
            price_glass: input.price_glass || null,
            producer: input.producer || null,
            region: input.region || null,
            denomination: input.denomination || null,
            grape_varieties: input.grape_varieties || null,
            year: input.year || null,
            description: input.description || null,
            available: true,
            recommended: false,
          })
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          wines: [...prev.wines, { ...wine, ratings: [] }],
        }))

        // Trigger enrichment asynchronously
        fetch('/api/enrichment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wine_id: wine.id }),
        }).catch(console.error)

        return wine
      } catch (error) {
        console.error('Error adding wine:', error)
        return null
      }
    },
    [supabase, venue?.id]
  )

  const updateWineData = useCallback(
    async (wineId: string, updates: WineUpdateInput) => {
      try {
        const { data: wine, error } = await supabase
          .from('wines')
          .update(updates)
          .eq('id', wineId)
          .select()
          .single()

        if (error) throw error

        setState((prev) => ({
          ...prev,
          wines: prev.wines.map((w) =>
            w.id === wineId ? { ...w, ...wine } : w
          ),
        }))
        return true
      } catch (error) {
        console.error('Error updating wine:', error)
        return false
      }
    },
    [supabase]
  )

  const toggleAvailability = useCallback(
    async (wineId: string, available: boolean) => {
      return updateWineData(wineId, { available })
    },
    [updateWineData]
  )

  const removeWine = useCallback(
    async (wineId: string) => {
      try {
        const { error } = await supabase
          .from('wines')
          .delete()
          .eq('id', wineId)

        if (error) throw error

        setState((prev) => ({
          ...prev,
          wines: prev.wines.filter((w) => w.id !== wineId),
        }))
        return true
      } catch (error) {
        console.error('Error removing wine:', error)
        return false
      }
    },
    [supabase]
  )

  const refreshWineEnrichment = useCallback(
    async (wineId: string) => {
      try {
        const res = await fetch('/api/enrichment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wine_id: wineId }),
        })

        if (!res.ok) return false

        // Reload wines to get updated ratings
        await fetchWines()
        return true
      } catch (error) {
        console.error('Error refreshing wine enrichment:', error)
        return false
      }
    },
    [fetchWines]
  )

  // Combined loading state: auth loading OR wines loading
  const isLoading = isAuthLoading || state.isLoadingWines

  return {
    // Auth state (from context)
    isAuthenticated,
    isLoading,
    venue,
    isSuperAdmin,
    isVenueAdmin,

    // Wine state
    wines: state.wines,
    error: state.error,

    // Actions
    logout: signOut,
    fetchWines,
    addWine,
    updateWine: updateWineData,
    toggleAvailability,
    removeWine,
    refreshWineEnrichment,
  }
}
