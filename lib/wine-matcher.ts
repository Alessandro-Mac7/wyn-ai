/**
 * Wine matching module using fuzzy search
 * Matches scanned wine labels against venue's wine list
 */

import Fuse, { IFuseOptions } from 'fuse.js'
import type { Wine, ScanResult, WineMatch, WineWithRatings } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

const FUSE_OPTIONS: IFuseOptions<Wine | WineWithRatings> = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'producer', weight: 0.3 },
    { name: 'denomination', weight: 0.15 },
    { name: 'region', weight: 0.1 },
    { name: 'grape_varieties', weight: 0.05 },
  ],
  threshold: 0.4, // Lower = more strict matching
  includeScore: true,
  ignoreLocation: true, // Search entire string
  minMatchCharLength: 2,
}

// Thresholds for match quality
const EXACT_MATCH_THRESHOLD = 0.1
const GOOD_MATCH_THRESHOLD = 0.3
const ACCEPTABLE_MATCH_THRESHOLD = 0.5

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Find the best matching wine from venue's list
 * @param scannedWine - Extracted wine info from label scan
 * @param venueWines - List of wines available at the venue
 * @returns Best match with confidence score, or null if no good match
 */
export function findMatchingWine<T extends Wine | WineWithRatings>(
  scannedWine: ScanResult,
  venueWines: T[]
): WineMatch<T> | null {
  if (!scannedWine.name || venueWines.length === 0) {
    return null
  }

  // Build search query from scanned wine data
  const searchQuery = buildSearchQuery(scannedWine)

  // Create Fuse instance
  const fuse = new Fuse(venueWines, FUSE_OPTIONS)

  // Search for matches
  const results = fuse.search(searchQuery)

  if (results.length === 0) {
    return null
  }

  const bestResult = results[0]
  const score = bestResult.score ?? 1

  // Only return if match is acceptable
  if (score > ACCEPTABLE_MATCH_THRESHOLD) {
    return null
  }

  // Calculate confidence (inverted score)
  const confidence = 1 - score

  // Determine match quality
  let matchQuality: WineMatch<T>['matchQuality']
  if (score < EXACT_MATCH_THRESHOLD) {
    matchQuality = 'exact'
  } else if (score < GOOD_MATCH_THRESHOLD) {
    matchQuality = 'high'
  } else {
    matchQuality = 'partial'
  }

  // Check if year matches (if both have year info)
  const yearMatches = !scannedWine.year ||
    !bestResult.item.year ||
    scannedWine.year === bestResult.item.year

  return {
    wine: bestResult.item,
    confidence,
    matchQuality,
    yearMatches,
  }
}

/**
 * Find similar wines when no exact match is found
 * Useful for suggesting alternatives
 * @param scannedWine - Extracted wine info from label scan
 * @param venueWines - List of wines available at the venue
 * @param limit - Maximum number of alternatives to return
 * @returns List of similar wines with match scores
 */
export function findSimilarWines<T extends Wine | WineWithRatings>(
  scannedWine: ScanResult,
  venueWines: T[],
  limit: number = 3
): WineMatch<T>[] {
  if (venueWines.length === 0) {
    return []
  }

  // Filter wines of same type if known
  let candidates = venueWines
  if (scannedWine.wine_type) {
    const sameTypeWines = venueWines.filter(w => w.wine_type === scannedWine.wine_type)
    if (sameTypeWines.length > 0) {
      candidates = sameTypeWines
    }
  }

  // Create Fuse with relaxed threshold for alternatives
  const relaxedOptions: IFuseOptions<T> = {
    ...FUSE_OPTIONS,
    threshold: 0.7, // More permissive for alternatives
  }

  const fuse = new Fuse(candidates, relaxedOptions)

  // Build query prioritizing region and grape varieties for alternatives
  const searchQuery = buildAlternativeQuery(scannedWine)
  const results = fuse.search(searchQuery, { limit })

  return results.map(result => ({
    wine: result.item,
    confidence: 1 - (result.score ?? 1),
    matchQuality: 'partial' as const,
    yearMatches: true, // Not relevant for alternatives
  }))
}

/**
 * Find wines by specific criteria
 * Useful for targeted searches
 */
export function findWinesByCriteria<T extends Wine | WineWithRatings>(
  venueWines: T[],
  criteria: {
    wineType?: string
    region?: string
    priceRange?: { min?: number; max?: number }
    producer?: string
  }
): T[] {
  let results = venueWines

  if (criteria.wineType) {
    results = results.filter(w => w.wine_type === criteria.wineType)
  }

  if (criteria.region) {
    const regionLower = criteria.region.toLowerCase()
    results = results.filter(w =>
      w.region?.toLowerCase().includes(regionLower)
    )
  }

  if (criteria.producer) {
    const producerLower = criteria.producer.toLowerCase()
    results = results.filter(w =>
      w.producer?.toLowerCase().includes(producerLower)
    )
  }

  if (criteria.priceRange) {
    const { min, max } = criteria.priceRange
    results = results.filter(w => {
      if (min !== undefined && w.price < min) return false
      if (max !== undefined && w.price > max) return false
      return true
    })
  }

  return results
}

// ============================================
// HELPERS
// ============================================

/**
 * Build search query string from scanned wine data
 */
function buildSearchQuery(scannedWine: ScanResult): string {
  const parts: string[] = []

  if (scannedWine.name) parts.push(scannedWine.name)
  if (scannedWine.producer) parts.push(scannedWine.producer)
  if (scannedWine.denomination) parts.push(scannedWine.denomination)

  return parts.join(' ')
}

/**
 * Build query for finding alternatives (less specific)
 */
function buildAlternativeQuery(scannedWine: ScanResult): string {
  const parts: string[] = []

  // Prioritize region and grape varieties for alternatives
  if (scannedWine.region) parts.push(scannedWine.region)
  if (scannedWine.denomination) parts.push(scannedWine.denomination)
  if (scannedWine.grape_varieties?.length) {
    parts.push(...scannedWine.grape_varieties)
  }

  // Fall back to name/producer if no other info
  if (parts.length === 0) {
    if (scannedWine.name) parts.push(scannedWine.name)
    if (scannedWine.producer) parts.push(scannedWine.producer)
  }

  return parts.join(' ')
}

/**
 * Calculate similarity between two strings (0-1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0

  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()

  if (aLower === bLower) return 1

  // Simple containment check
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    return 0.8
  }

  // Levenshtein-based similarity would be better but Fuse handles this
  return 0
}
