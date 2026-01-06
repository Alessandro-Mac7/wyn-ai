'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { WINES_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/config/constants'
import type { WineWithRatings, WineType, WineCreateInput, WineUpdateInput } from '@/types'

interface UsePaginatedWinesOptions {
  venueId: string | null
}

interface UsePaginatedWinesReturn {
  // Data
  wines: WineWithRatings[]
  total: number

  // Loading states
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null

  // Filters
  searchQuery: string
  filterType: WineType | 'all'

  // Actions
  loadMore: () => Promise<void>
  search: (query: string) => void
  setFilter: (type: WineType | 'all') => void
  refresh: () => Promise<void>

  // CRUD operations
  addWine: (input: WineCreateInput) => Promise<boolean>
  updateWine: (id: string, input: WineUpdateInput) => Promise<boolean>
  removeWine: (id: string) => Promise<boolean>
}

export function usePaginatedWines({ venueId }: UsePaginatedWinesOptions): UsePaginatedWinesReturn {
  const [supabase] = useState(() => createSupabaseBrowserClient())

  // Data state
  const [wines, setWines] = useState<WineWithRatings[]>([])
  const [total, setTotal] = useState(0)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<WineType | 'all'>('all')

  // Debounce ref
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const currentSearchRef = useRef('')
  const currentFilterRef = useRef<WineType | 'all'>('all')

  // Fetch wines with pagination
  const fetchWines = useCallback(
    async (options: { reset?: boolean; searchOverride?: string; filterOverride?: WineType | 'all' } = {}) => {
      if (!venueId) return

      const { reset = false, searchOverride, filterOverride } = options
      const searchToUse = searchOverride ?? currentSearchRef.current
      const filterToUse = filterOverride ?? currentFilterRef.current

      if (reset) {
        setIsLoading(true)
        setError(null)
      } else {
        setIsLoadingMore(true)
      }

      try {
        let query = supabase
          .from('wines')
          .select('*, ratings:wine_ratings(*)', { count: 'exact' })
          .eq('venue_id', venueId)

        // Apply type filter
        if (filterToUse && filterToUse !== 'all') {
          query = query.eq('wine_type', filterToUse)
        }

        // Apply search filter (server-side)
        if (searchToUse) {
          query = query.or(
            `name.ilike.%${searchToUse}%,producer.ilike.%${searchToUse}%,region.ilike.%${searchToUse}%`
          )
        }

        // Apply sorting and pagination
        const offset = reset ? 0 : wines.length
        query = query
          .order('wine_type')
          .order('name')
          .range(offset, offset + WINES_PAGE_SIZE - 1)

        const { data, error: queryError, count } = await query

        if (queryError) throw queryError

        const newWines = (data || []) as WineWithRatings[]

        if (reset) {
          setWines(newWines)
        } else {
          setWines((prev) => [...prev, ...newWines])
        }

        setHasMore(newWines.length === WINES_PAGE_SIZE)
        setTotal(count || 0)
        setError(null)
      } catch (err) {
        console.error('Fetch wines error:', err)
        setError('Errore nel caricamento dei vini')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [venueId, supabase, wines.length]
  )

  // Initial load when venueId changes
  useEffect(() => {
    if (venueId) {
      currentSearchRef.current = ''
      currentFilterRef.current = 'all'
      setSearchQuery('')
      setFilterType('all')
      fetchWines({ reset: true })
    }

    // Cleanup debounce timeout on unmount
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [venueId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load more wines (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return
    await fetchWines({ reset: false })
  }, [fetchWines, isLoadingMore, hasMore, isLoading])

  // Search with debounce
  const search = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }

      searchDebounceRef.current = setTimeout(() => {
        currentSearchRef.current = query
        fetchWines({ reset: true, searchOverride: query })
      }, SEARCH_DEBOUNCE_MS)
    },
    [fetchWines]
  )

  // Set filter type
  const setFilter = useCallback(
    (type: WineType | 'all') => {
      setFilterType(type)
      currentFilterRef.current = type
      fetchWines({ reset: true, filterOverride: type })
    },
    [fetchWines]
  )

  // Refresh wine list
  const refresh = useCallback(async () => {
    await fetchWines({ reset: true })
  }, [fetchWines])

  // CRUD: Add wine
  const addWine = useCallback(
    async (input: WineCreateInput): Promise<boolean> => {
      if (!venueId) return false

      try {
        const { data: wine, error } = await supabase
          .from('wines')
          .insert({
            venue_id: venueId,
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

        // Add to local state
        setWines((prev) => [{ ...wine, ratings: [] }, ...prev])
        setTotal((prev) => prev + 1)

        // Trigger enrichment
        fetch('/api/enrichment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wine_id: wine.id }),
        }).catch(console.error)

        return true
      } catch (err) {
        console.error('Add wine error:', err)
        return false
      }
    },
    [supabase, venueId]
  )

  // CRUD: Update wine
  const updateWine = useCallback(
    async (id: string, input: WineUpdateInput): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from('wines')
          .update(input)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        setWines((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)))
        return true
      } catch (err) {
        console.error('Update wine error:', err)
        return false
      }
    },
    [supabase]
  )

  // CRUD: Remove wine
  const removeWine = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('wines').delete().eq('id', id)
        if (error) throw error

        setWines((prev) => prev.filter((w) => w.id !== id))
        setTotal((prev) => prev - 1)
        return true
      } catch (err) {
        console.error('Remove wine error:', err)
        return false
      }
    },
    [supabase]
  )

  return {
    wines,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    filterType,
    loadMore,
    search,
    setFilter,
    refresh,
    addWine,
    updateWine,
    removeWine,
  }
}
