/**
 * RAG (Retrieval Augmented Generation) Module
 *
 * Semantic wine search using pgvector for large wine catalogs.
 * Uses OpenAI embeddings + PostgreSQL match_wines() function.
 */

import { embedText } from './embeddings'
import { supabaseAdmin } from './supabase-auth-server'
import type { WineWithRatings, WineType } from '@/types'
import { RAG_TOP_K, RAG_SIMILARITY_THRESHOLD } from '@/config/constants'

// ============================================
// TYPES
// ============================================

export interface RAGSearchOptions {
  venueId: string
  query: string
  topK?: number // Default 8
  threshold?: number // Default 0.4
  onlyAvailable?: boolean // Default true
  wineType?: WineType
  maxPrice?: number
  minPrice?: number
}

export interface RAGSearchResult {
  wines: WineWithRatings[]
  ragContext: string // Formatted string for LLM prompt
  totalMatched: number
  searchTimeMs: number
}

interface MatchWinesRawResult {
  wine_id: string
  venue_id: string
  content_text: string
  wine_type: string
  price: number
  available: boolean
  similarity: number
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Search wines using semantic similarity via pgvector
 *
 * @param options - Search parameters including query, venue, and filters
 * @returns Search results with matched wines and formatted context for LLM
 */
export async function searchWinesRAG(options: RAGSearchOptions): Promise<RAGSearchResult> {
  const startTime = Date.now()

  const {
    venueId,
    query,
    topK = RAG_TOP_K,
    threshold = RAG_SIMILARITY_THRESHOLD,
    onlyAvailable = true,
    wineType,
    maxPrice,
    minPrice,
  } = options

  try {
    // Step 1: Embed the query
    const queryEmbedding = await embedText(query)

    // Step 2: Call PostgreSQL match_wines function
    // IMPORTANT: pgvector expects embedding as JSON string
    const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_wines', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_venue_id: venueId,
      match_threshold: threshold,
      match_count: topK,
      filter_available: onlyAvailable,
      filter_wine_type: wineType || null,
      filter_min_price: minPrice || null,
      filter_max_price: maxPrice || null,
    })

    if (matchError) {
      console.error('[RAG] match_wines error:', matchError)
      throw new Error(`Failed to search wines: ${matchError.message}`)
    }

    const rawMatches = (matches || []) as MatchWinesRawResult[]

    // No matches found
    if (rawMatches.length === 0) {
      const endTime = Date.now()
      return {
        wines: [],
        ragContext: '',
        totalMatched: 0,
        searchTimeMs: endTime - startTime,
      }
    }

    // Step 3: Load full wine data with ratings
    const wineIds = rawMatches.map((m) => m.wine_id)
    const { data: wines, error: winesError } = await supabaseAdmin
      .from('wines')
      .select(`
        *,
        ratings:wine_ratings(*)
      `)
      .in('id', wineIds)

    if (winesError) {
      console.error('[RAG] Error loading wines:', winesError)
      throw new Error(`Failed to load wine details: ${winesError.message}`)
    }

    const winesWithRatings = (wines || []) as WineWithRatings[]

    // Preserve order from RAG matches (by similarity score)
    const wineMap = new Map(winesWithRatings.map((w) => [w.id, w]))
    const orderedWines = wineIds.map((id) => wineMap.get(id)).filter(Boolean) as WineWithRatings[]

    // Step 4: Format context for LLM prompt
    const ragContext = formatWinesForRAGContext(orderedWines)

    const endTime = Date.now()

    return {
      wines: orderedWines,
      ragContext,
      totalMatched: orderedWines.length,
      searchTimeMs: endTime - startTime,
    }
  } catch (error) {
    console.error('[RAG] Search failed:', error)
    throw error
  }
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format wines into compact context string for LLM prompt
 * Similar format to formatWineWithRatingsForPrompt in prompts.ts
 */
function formatWinesForRAGContext(wines: WineWithRatings[]): string {
  if (wines.length === 0) {
    return 'Nessun vino trovato.'
  }

  // Group by wine type for better structure
  const grouped = groupWinesByType(wines)

  let result = ''
  for (const [type, typeWines] of Object.entries(grouped)) {
    const typeLabel = getTypeLabel(type as WineType)
    result += `\n### ${typeLabel}\n`

    for (const wine of typeWines) {
      result += formatWineForRAGContext(wine)
    }
  }

  return result.trim()
}

/**
 * Format a single wine with ratings for RAG context
 */
function formatWineForRAGContext(wine: WineWithRatings): string {
  const parts: string[] = []

  // Name and year
  let nameLine = `- **${wine.name}**`
  if (wine.year) {
    nameLine += ` (${wine.year})`
  }
  parts.push(nameLine)

  // Price
  let priceLine = ` - €${wine.price}/bottiglia`
  if (wine.price_glass) {
    priceLine += `, €${wine.price_glass}/calice`
  }
  parts.push(priceLine)

  // Details (producer, region, grapes)
  const details: string[] = []
  if (wine.producer) details.push(wine.producer)
  if (wine.region) details.push(wine.region)
  if (wine.grape_varieties?.length) {
    details.push(wine.grape_varieties.join(', '))
  }

  if (details.length > 0) {
    parts.push(`\n  ${details.join(' | ')}`)
  }

  // Ratings (only high-confidence)
  if (wine.ratings && wine.ratings.length > 0) {
    const ratingsText = wine.ratings
      .filter((r) => r.confidence >= 0.7)
      .map((r) => `${r.guide_name}: ${r.score}`)
      .join(', ')

    if (ratingsText) {
      parts.push(`\n  ⭐ ${ratingsText}`)
    }
  }

  // Description
  if (wine.description) {
    parts.push(`\n  ${wine.description}`)
  }

  return parts.join('') + '\n'
}

/**
 * Group wines by wine type
 */
function groupWinesByType(wines: WineWithRatings[]): Record<string, WineWithRatings[]> {
  return wines.reduce((acc, wine) => {
    const type = wine.wine_type
    if (!acc[type]) acc[type] = []
    acc[type].push(wine)
    return acc
  }, {} as Record<string, WineWithRatings[]>)
}

/**
 * Get Italian label for wine type
 */
function getTypeLabel(type: WineType): string {
  const labels: Record<WineType, string> = {
    red: 'Vini Rossi',
    white: 'Vini Bianchi',
    rose: 'Vini Rosé',
    sparkling: 'Spumanti',
    dessert: 'Vini da Dessert',
  }
  return labels[type]
}
