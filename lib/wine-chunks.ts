/**
 * Wine Content Chunking Module
 *
 * Converts wine data into embedding-optimized text chunks for semantic search.
 * Target: 150-300 tokens per chunk, Italian-optimized.
 */

import { WineWithRatings, WineKnowledge } from '@/types'
import { MIN_RATING_CONFIDENCE } from '@/config/constants'

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

  // Producer philosophy
  if (knowledge.producer_philosophy) {
    knowledgeParts.push(`\nFilosofia del Produttore:\n${knowledge.producer_philosophy}`)
  }

  // Terroir description
  if (knowledge.terroir_description) {
    knowledgeParts.push(`\nTerroir:\n${knowledge.terroir_description}`)
  }

  // Vineyard details
  if (knowledge.vineyard_details) {
    knowledgeParts.push(`\nVigneto:\n${knowledge.vineyard_details}`)
  }

  // Soil and climate
  const terrainParts: string[] = []
  if (knowledge.soil_type) terrainParts.push(`Terreno: ${knowledge.soil_type}`)
  if (knowledge.climate) terrainParts.push(`Clima: ${knowledge.climate}`)
  if (terrainParts.length > 0) {
    knowledgeParts.push(`\n${terrainParts.join(', ')}`)
  }

  // Vinification process
  if (knowledge.vinification_process) {
    knowledgeParts.push(`\nVinificazione:\n${knowledge.vinification_process}`)
  }

  // Aging method and duration
  if (knowledge.aging_method) {
    const agingText = knowledge.aging_duration
      ? `${knowledge.aging_method} (${knowledge.aging_duration})`
      : knowledge.aging_method
    knowledgeParts.push(`\nAffinamento:\n${agingText}`)
  }

  // Vintage notes
  if (knowledge.vintage_notes) {
    const vintageText = knowledge.vintage_quality
      ? `${knowledge.vintage_notes} (Qualità: ${knowledge.vintage_quality})`
      : knowledge.vintage_notes
    knowledgeParts.push(`\nAnnata:\n${vintageText}`)
  }

  // Food pairings (expanded format)
  if (knowledge.food_pairings && knowledge.food_pairings.length > 0) {
    const pairingsText = knowledge.food_pairings
      .map((pairing) => {
        const dishesText = pairing.dishes.join(', ')
        const notesText = pairing.notes ? ` - ${pairing.notes}` : ''
        return `${pairing.category}: ${dishesText} (${pairing.match})${notesText}`
      })
      .join('\n')
    knowledgeParts.push(`\nAbbinamenti:\n${pairingsText}`)
  }

  // Serving information
  const servingParts: string[] = []
  if (knowledge.serving_temperature) servingParts.push(`Temperatura: ${knowledge.serving_temperature}`)
  if (knowledge.decanting_time) servingParts.push(`Decantazione: ${knowledge.decanting_time}`)
  if (knowledge.glass_type) servingParts.push(`Bicchiere: ${knowledge.glass_type}`)
  if (servingParts.length > 0) {
    knowledgeParts.push(`\nServizio:\n${servingParts.join('\n')}`)
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
