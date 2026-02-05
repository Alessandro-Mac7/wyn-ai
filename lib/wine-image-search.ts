/**
 * Wine Image Search Module
 * Attempts to find bottle images from web sources
 */

import type { ScanResult } from '@/types'

// Known wine image sources
const VIVINO_SEARCH_URL = 'https://www.vivino.com/search/wines'
const WINE_SEARCHER_URL = 'https://www.wine-searcher.com/find'

/**
 * Build a search query from scan result
 */
function buildSearchQuery(scan: ScanResult): string {
  const parts: string[] = []

  if (scan.name) parts.push(scan.name)
  if (scan.producer) parts.push(scan.producer)
  if (scan.year) parts.push(String(scan.year))

  return parts.join(' ').trim()
}

/**
 * Build Vivino search URL for a wine
 * Users can click through to see the wine on Vivino
 */
export function buildVivinoSearchUrl(scan: ScanResult): string {
  const query = buildSearchQuery(scan)
  if (!query) return ''

  return `${VIVINO_SEARCH_URL}?q=${encodeURIComponent(query)}`
}

/**
 * Build Wine-Searcher search URL for a wine
 */
export function buildWineSearcherUrl(scan: ScanResult): string {
  const query = buildSearchQuery(scan)
  if (!query) return ''

  return `${WINE_SEARCHER_URL}/${encodeURIComponent(query.replace(/\s+/g, '+'))}`
}

/**
 * Attempt to find a wine bottle image URL
 *
 * Strategy:
 * 1. Try to fetch from a known wine database API (if available)
 * 2. Fallback to constructed search URL
 *
 * For MVP, we return a search URL that the frontend can use
 * to potentially fetch or display a "search on Vivino" link
 */
export async function searchWineImage(scan: ScanResult): Promise<string | null> {
  const query = buildSearchQuery(scan)
  if (!query) return null

  try {
    // Try Vivino API (unofficial, may not work)
    // Note: Vivino doesn't have a public API, so this is best-effort
    const vivinoSearchUrl = `https://www.vivino.com/api/explore/explore?q=${encodeURIComponent(query)}&limit=1`

    const response = await fetch(vivinoSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WYN Wine App)',
        'Accept': 'application/json',
      },
      // Short timeout to not block the response
      signal: AbortSignal.timeout(3000),
    })

    if (response.ok) {
      const data = await response.json()
      // Vivino API structure (unofficial)
      const firstMatch = data?.explore_vintage?.matches?.[0]?.vintage?.image?.location
      if (firstMatch) {
        return firstMatch
      }
    }
  } catch {
    // Vivino API failed (expected - it's unofficial)
    // Continue to fallback
  }

  // Fallback: Try Wine-Searcher (also unofficial)
  try {
    const wsUrl = `https://www.wine-searcher.com/images/labels/${encodeURIComponent(
      query.toLowerCase().replace(/\s+/g, '-')
    )}`

    // Just check if URL might exist (HEAD request)
    const response = await fetch(wsUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    })

    if (response.ok) {
      return wsUrl
    }
  } catch {
    // Wine-Searcher also failed
  }

  // No image found from APIs
  return null
}

/**
 * Get a placeholder wine image based on wine type
 */
export function getWineTypePlaceholder(wineType?: string | null): string {
  // Using Unsplash source for consistent wine images
  const typeImages: Record<string, string> = {
    red: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=280&fit=crop',
    white: 'https://images.unsplash.com/photo-1558001731-c9def89e98cc?w=200&h=280&fit=crop',
    rose: 'https://images.unsplash.com/photo-1558001731-c9def89e98cc?w=200&h=280&fit=crop',
    sparkling: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=200&h=280&fit=crop',
    dessert: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=200&h=280&fit=crop',
  }

  return typeImages[wineType || 'red'] || typeImages.red
}
