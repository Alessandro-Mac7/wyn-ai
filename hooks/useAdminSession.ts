'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import type { WineWithRatings, WineCreateInput, WineUpdateInput } from '@/types'

interface VenueInfo {
  id: string
  slug: string
  name: string
}

/**
 * Simplified admin session hook.
 *
 * Design principle: Trust the middleware.
 * By the time user reaches /admin/dashboard, middleware has already:
 * 1. Validated the session
 * 2. Verified venue_admin role
 * 3. Redirected if unauthorized
 *
 * This hook simply:
 * 1. Gets user data once on mount
 * 2. Fetches venue for the user
 * 3. Manages wines CRUD
 * 4. Listens only for sign-out event
 */
export function useAdminSession() {
  const [supabase] = useState(() => createSupabaseBrowserClient())

  // Minimal auth state
  const [user, setUser] = useState<User | null>(null)
  const [venue, setVenue] = useState<VenueInfo | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Wine state
  const [wines, setWines] = useState<WineWithRatings[]>([])
  const [isLoadingWines, setIsLoadingWines] = useState(false)

  // Initialize: get user and venue ONCE on mount
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        // Single call to get current user - this is reliable
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!mounted) return

        if (!currentUser) {
          // Middleware should have caught this, but handle gracefully
          setIsReady(true)
          return
        }

        setUser(currentUser)

        // Fetch venue for this user
        const { data: venueData } = await supabase
          .from('venues')
          .select('id, slug, name')
          .eq('owner_id', currentUser.id)
          .single()

        if (!mounted) return

        if (venueData) {
          setVenue(venueData)
        }

        setIsReady(true)
      } catch (error) {
        console.error('Init error:', error)
        if (mounted) setIsReady(true)
      }
    }

    init()

    // Listen ONLY for sign-out (user initiated logout)
    // We don't need to handle INITIAL_SESSION or other events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setVenue(null)
        setWines([])
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Fetch wines
  const fetchWines = useCallback(async () => {
    if (!venue?.id) return

    setIsLoadingWines(true)

    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*, ratings:wine_ratings(*)')
        .eq('venue_id', venue.id)
        .order('wine_type')
        .order('name')

      if (!error && data) {
        setWines(data as WineWithRatings[])
      }
    } catch (error) {
      console.error('Error fetching wines:', error)
    } finally {
      setIsLoadingWines(false)
    }
  }, [supabase, venue?.id])

  // Auto-fetch wines when venue becomes available
  useEffect(() => {
    if (venue?.id) {
      fetchWines()
    }
  }, [venue?.id, fetchWines])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const addWine = useCallback(async (input: WineCreateInput): Promise<boolean> => {
    if (!venue?.id) return false

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

      setWines(prev => [...prev, { ...wine, ratings: [] }])

      // Trigger enrichment async
      fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wine_id: wine.id }),
      }).catch(console.error)

      return true
    } catch (error) {
      console.error('Error adding wine:', error)
      return false
    }
  }, [supabase, venue?.id])

  const updateWine = useCallback(async (id: string, input: WineUpdateInput): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('wines')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setWines(prev => prev.map(w => w.id === id ? { ...w, ...data } : w))
      return true
    } catch (error) {
      console.error('Error updating wine:', error)
      return false
    }
  }, [supabase])

  const toggleAvailability = useCallback(async (id: string, available: boolean): Promise<boolean> => {
    return updateWine(id, { available })
  }, [updateWine])

  const removeWine = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('wines').delete().eq('id', id)
      if (error) throw error
      setWines(prev => prev.filter(w => w.id !== id))
      return true
    } catch (error) {
      console.error('Error removing wine:', error)
      return false
    }
  }, [supabase])

  const refreshEnrichment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wine_id: id }),
      })
      if (!res.ok) return false
      await fetchWines()
      return true
    } catch (error) {
      console.error('Error refreshing enrichment:', error)
      return false
    }
  }, [fetchWines])

  return {
    // Auth state (minimal)
    user,
    venue,
    isReady,

    // Wine state
    wines,
    isLoadingWines,

    // Actions
    signOut,
    fetchWines,
    addWine,
    updateWine,
    toggleAvailability,
    removeWine,
    refreshEnrichment,
  }
}
