import { createClient } from '@supabase/supabase-js'
import type { Venue, Wine, WineWithRatings, WineCreateInput, WineUpdateInput } from '@/types'

// ============================================
// SUPABASE CLIENT
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// VENUE FUNCTIONS
// ============================================

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, slug, name, description, email, latitude, longitude, address, city, created_at, updated_at')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching venue:', error)
    return null
  }
  return data
}

export async function verifyVenueCredentials(
  email: string,
  password: string
): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, slug, name, description, email, latitude, longitude, address, city, created_at, updated_at')
    .eq('email', email)
    .eq('password_hash', password)
    .single()

  if (error) {
    console.error('Error verifying credentials:', error)
    return null
  }
  return data
}

// ============================================
// WINE FUNCTIONS
// ============================================

export async function getWinesByVenue(
  venueId: string,
  onlyAvailable = true
): Promise<Wine[]> {
  let query = supabase
    .from('wines')
    .select('*')
    .eq('venue_id', venueId)
    .order('wine_type')
    .order('name')

  if (onlyAvailable) {
    query = query.eq('available', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching wines:', error)
    return []
  }
  return data || []
}

export async function getWinesWithRatings(
  venueId: string,
  onlyAvailable = false
): Promise<WineWithRatings[]> {
  let query = supabase
    .from('wines')
    .select(`
      *,
      ratings:wine_ratings(*)
    `)
    .eq('venue_id', venueId)
    .order('wine_type')
    .order('name')

  if (onlyAvailable) {
    query = query.eq('available', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching wines with ratings:', error)
    return []
  }

  return (data || []) as WineWithRatings[]
}

export async function getWineById(wineId: string): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', wineId)
    .single()

  if (error) {
    console.error('Error fetching wine:', error)
    return null
  }
  return data
}

export async function createWine(
  venueId: string,
  input: WineCreateInput
): Promise<Wine | null> {
  const { data, error } = await supabase
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
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating wine:', error)
    return null
  }
  return data
}

export async function updateWine(
  wineId: string,
  input: WineUpdateInput
): Promise<Wine | null> {
  const updates: Record<string, unknown> = {}

  if (input.name !== undefined) updates.name = input.name
  if (input.wine_type !== undefined) updates.wine_type = input.wine_type
  if (input.price !== undefined) updates.price = input.price
  if (input.price_glass !== undefined) updates.price_glass = input.price_glass
  if (input.producer !== undefined) updates.producer = input.producer
  if (input.region !== undefined) updates.region = input.region
  if (input.denomination !== undefined) updates.denomination = input.denomination
  if (input.grape_varieties !== undefined) updates.grape_varieties = input.grape_varieties
  if (input.year !== undefined) updates.year = input.year
  if (input.description !== undefined) updates.description = input.description
  if (input.available !== undefined) updates.available = input.available
  if (input.recommended !== undefined) updates.recommended = input.recommended

  const { data, error } = await supabase
    .from('wines')
    .update(updates)
    .eq('id', wineId)
    .select()
    .single()

  if (error) {
    console.error('Error updating wine:', error)
    return null
  }
  return data
}

export async function deleteWine(wineId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', wineId)

  if (error) {
    console.error('Error deleting wine:', error)
    return false
  }
  return true
}

export async function toggleWineAvailability(
  wineId: string,
  available: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('wines')
    .update({ available })
    .eq('id', wineId)

  if (error) {
    console.error('Error toggling wine availability:', error)
    return false
  }
  return true
}

// ============================================
// RATING FUNCTIONS
// ============================================

export async function deleteWineRatings(wineId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wine_ratings')
    .delete()
    .eq('wine_id', wineId)

  if (error) {
    console.error('Error deleting wine ratings:', error)
    return false
  }
  return true
}

export async function addWineRating(
  wineId: string,
  rating: {
    guide_id: string
    guide_name: string
    score: string
    confidence: number
    year?: number
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('wine_ratings')
    .insert({
      wine_id: wineId,
      ...rating,
    })

  if (error) {
    console.error('Error adding rating:', error)
    return false
  }
  return true
}

// ============================================
// ENRICHMENT JOB FUNCTIONS
// ============================================

export async function createEnrichmentJob(wineId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('enrichment_jobs')
    .insert({
      wine_id: wineId,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating enrichment job:', error)
    return null
  }
  return data.id
}

export async function updateEnrichmentJob(
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<boolean> {
  const updates: Record<string, unknown> = { status }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  if (errorMessage) {
    updates.error_message = errorMessage
  }

  const { error } = await supabase
    .from('enrichment_jobs')
    .update(updates)
    .eq('id', jobId)

  if (error) {
    console.error('Error updating enrichment job:', error)
    return false
  }
  return true
}
