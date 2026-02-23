/**
 * Wine Content Chunking Module
 *
 * Converts wine data into embedding-optimized text chunks for semantic search.
 * Target: 150-300 tokens per chunk, Italian-optimized.
 */

import { WineWithRatings } from '@/types'
import { MIN_RATING_CONFIDENCE } from '@/config/constants'

// ============================================
// WINE KNOWLEDGE TYPES (Phase 2 Placeholder)
// ============================================

/**
 * Placeholder interface for Phase 2 wine knowledge.
 * Will be properly defined in types/index.ts when deep knowledge features are implemented.
 */
export interface WineKnowledge {
  producer_history?: string
  terroir_description?: string
  vinification_process?: string
  aging_method?: string
  food_pairings?: Array<{
    category: string
    dishes: string[]
    match: string
  }>
  anecdotes?: string
  curiosities?: string[]
}

// ============================================
// WINE TYPE MAPPING
// ============================================

const WINE_TYPE_IT: Record<string, string> = {
  red: 'Rosso',
  white: 'Bianco',
  rose: 'Rosé',
  sparkling: 'Spumante',
  dessert: 'Dessert',
}

// ============================================
// CHUNK CONFIDENCE THRESHOLD
// ============================================

/**
 * Confidence threshold for including ratings in chunks.
 * Higher than MIN_RATING_CONFIDENCE (0.4) to ensure quality in search results.
 */
const CHUNK_RATING_CONFIDENCE = 0.7

// ============================================
// CORE CHUNKING FUNCTIONS
// ============================================

/**
 * Converts a wine into embedding-optimized text for semantic search.
 *
 * Format (Italian-optimized):
 * - Name (Year if available)
 * - Type, Price, Producer, Region, Denomination, Grape varieties
 * - Description
 * - High-confidence ratings (>= 0.7)
 * - "Consigliato dal locale" badge if recommended
 *
 * @param wine - Wine with ratings
 * @returns Formatted text chunk (150-300 tokens)
 */
export function wineToChunkText(wine: WineWithRatings): string {
  const parts: string[] = []

  // Name and year
  const nameWithYear = wine.year ? `${wine.name} (${wine.year})` : wine.name
  parts.push(nameWithYear)

  // Wine type (required field)
  const wineTypeIT = WINE_TYPE_IT[wine.wine_type] || wine.wine_type
  parts.push(`Tipo: ${wineTypeIT}`)

  // Price (required field)
  const priceText = wine.price_glass
    ? `Prezzo: €${wine.price}/bottiglia, €${wine.price_glass}/calice`
    : `Prezzo: €${wine.price}/bottiglia`
  parts.push(priceText)

  // Producer
  if (wine.producer) {
    parts.push(`Produttore: ${wine.producer}`)
  }

  // Region
  if (wine.region) {
    parts.push(`Regione: ${wine.region}`)
  }

  // Denomination
  if (wine.denomination) {
    parts.push(`Denominazione: ${wine.denomination}`)
  }

  // Grape varieties
  if (wine.grape_varieties && wine.grape_varieties.length > 0) {
    parts.push(`Vitigni: ${wine.grape_varieties.join(', ')}`)
  }

  // Description
  if (wine.description) {
    parts.push(wine.description)
  }

  // Ratings (only high-confidence)
  const highConfidenceRatings = wine.ratings.filter(
    (r) => r.confidence >= CHUNK_RATING_CONFIDENCE
  )
  if (highConfidenceRatings.length > 0) {
    const ratingsText = highConfidenceRatings
      .map((r) => `${r.guide_name}: ${r.score}`)
      .join(', ')
    parts.push(`Valutazioni: ${ratingsText}`)
  }

  // Recommended badge
  if (wine.recommended) {
    parts.push('Consigliato dal locale')
  }

  return parts.join('\n')
}

/**
 * Enhanced version that includes deep wine knowledge when available.
 *
 * Appends knowledge sections to base chunk text:
 * - Producer history
 * - Terroir description
 * - Vinification and aging methods
 * - Food pairings (expanded format)
 * - Anecdotes and curiosities
 *
 * @param wine - Wine with ratings
 * @param knowledge - Optional deep wine knowledge (Phase 2)
 * @returns Enhanced text chunk with knowledge context
 */
export function wineToChunkTextWithKnowledge(
  wine: WineWithRatings,
  knowledge?: WineKnowledge | null
): string {
  // Base chunk text
  const baseText = wineToChunkText(wine)

  // If no knowledge provided, return base text
  if (!knowledge) {
    return baseText
  }

  const knowledgeParts: string[] = [baseText]

  // Producer history
  if (knowledge.producer_history) {
    knowledgeParts.push(`\nStoria del Produttore:\n${knowledge.producer_history}`)
  }

  // Terroir description
  if (knowledge.terroir_description) {
    knowledgeParts.push(`\nTerroir:\n${knowledge.terroir_description}`)
  }

  // Vinification process
  if (knowledge.vinification_process) {
    knowledgeParts.push(`\nVinificazione:\n${knowledge.vinification_process}`)
  }

  // Aging method
  if (knowledge.aging_method) {
    knowledgeParts.push(`\nAffinamento:\n${knowledge.aging_method}`)
  }

  // Food pairings (expanded format)
  if (knowledge.food_pairings && knowledge.food_pairings.length > 0) {
    const pairingsText = knowledge.food_pairings
      .map((pairing) => {
        const dishesText = pairing.dishes.join(', ')
        return `${pairing.category}: ${dishesText} (${pairing.match})`
      })
      .join('\n')
    knowledgeParts.push(`\nAbbinamenti:\n${pairingsText}`)
  }

  // Anecdotes
  if (knowledge.anecdotes) {
    knowledgeParts.push(`\nAneddoti:\n${knowledge.anecdotes}`)
  }

  // Curiosities
  if (knowledge.curiosities && knowledge.curiosities.length > 0) {
    const curiositiesText = knowledge.curiosities
      .map((c) => `• ${c}`)
      .join('\n')
    knowledgeParts.push(`\nCuriosità:\n${curiositiesText}`)
  }

  return knowledgeParts.join('\n')
}
