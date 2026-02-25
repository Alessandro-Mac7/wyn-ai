/**
 * Embedding Pipeline Orchestrator
 *
 * Manages embedding generation and synchronization for wines.
 * Uses OpenAI text-embedding-3-small for semantic search.
 */

import { WineWithRatings } from '@/types'
import { embedText, generateContentHash } from './embeddings'
import { wineToChunkText, wineToChunkTextWithKnowledge } from './wine-chunks'
import { getWineKnowledge } from './wine-knowledge'
import { supabaseAdmin } from './supabase-auth-server'

// ============================================
// TYPES
// ============================================

interface EmbeddingRecord {
  id: string
  wine_id: string
  venue_id: string
  embedding: number[]
  content_text: string
  content_hash: string
  wine_type: string
  price: number
  available: boolean
  created_at: string
  updated_at: string
}

interface VenueEmbeddingStats {
  embedded: number
  skipped: number
  failed: number
}

// ============================================
// SINGLE WINE EMBEDDING
// ============================================

/**
 * Embeds a single wine.
 * Generates chunk text, checks for changes via hash, and upserts embedding.
 *
 * @param wineId - Wine ID to embed
 * @returns true on success, false on failure
 */
export async function embedWine(wineId: string): Promise<boolean> {
  try {
    console.log(`[EMBEDDING] Processing wine ${wineId}`)

    // 1. Fetch wine with ratings
    const { data: wine, error: wineError } = await supabaseAdmin
      .from('wines')
      .select(`
        *,
        ratings:wine_ratings(*)
      `)
      .eq('id', wineId)
      .single()

    if (wineError || !wine) {
      console.error(`[EMBEDDING] Failed to fetch wine ${wineId}:`, wineError)
      return false
    }

    const wineWithRatings = wine as unknown as WineWithRatings

    // 2. Fetch wine knowledge if available
    const knowledge = await getWineKnowledge(wineId)

    // 3. Generate chunk text with knowledge and hash
    const chunkText = wineToChunkTextWithKnowledge(wineWithRatings, knowledge)
    const contentHash = generateContentHash(chunkText)

    // 4. Check if embedding exists with same hash (skip if unchanged)
    const { data: existingEmbedding } = await supabaseAdmin
      .from('wine_embeddings')
      .select('content_hash')
      .eq('wine_id', wineId)
      .single()

    if (existingEmbedding && existingEmbedding.content_hash === contentHash) {
      console.log(`[EMBEDDING] Wine ${wineId} unchanged, skipping`)
      return true
    }

    // 5. Generate embedding
    console.log(`[EMBEDDING] Generating embedding for wine ${wineId}`)
    const embedding = await embedText(chunkText)

    // 6. Upsert into wine_embeddings
    const { error: upsertError } = await supabaseAdmin
      .from('wine_embeddings')
      .upsert({
        wine_id: wineId,
        venue_id: wine.venue_id,
        embedding: embedding,
        content_text: chunkText,
        content_hash: contentHash,
        wine_type: wine.wine_type,
        price: wine.price,
        available: wine.available,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wine_id',
      })

    if (upsertError) {
      console.error(`[EMBEDDING] Failed to upsert embedding for wine ${wineId}:`, upsertError)
      return false
    }

    console.log(`[EMBEDDING] Successfully embedded wine ${wineId}`)
    return true

  } catch (error) {
    console.error(`[EMBEDDING] Error embedding wine ${wineId}:`, error)
    return false
  }
}

// ============================================
// VENUE BATCH EMBEDDING
// ============================================

/**
 * Embeds all wines for a venue in parallel batches.
 * Processes wines in batches of 10 to avoid overwhelming the API.
 *
 * @param venueId - Venue ID
 * @returns Statistics about embedded/skipped/failed wines
 */
export async function embedVenueWines(venueId: string): Promise<VenueEmbeddingStats> {
  const stats: VenueEmbeddingStats = {
    embedded: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    console.log(`[EMBEDDING] Starting batch embedding for venue ${venueId}`)

    // 1. Fetch all wines with ratings for the venue
    const { data: wines, error: winesError } = await supabaseAdmin
      .from('wines')
      .select(`
        *,
        ratings:wine_ratings(*)
      `)
      .eq('venue_id', venueId)

    if (winesError || !wines) {
      console.error(`[EMBEDDING] Failed to fetch wines for venue ${venueId}:`, winesError)
      return stats
    }

    const winesWithRatings = wines as unknown as WineWithRatings[]
    console.log(`[EMBEDDING] Found ${winesWithRatings.length} wines to process`)

    if (winesWithRatings.length === 0) {
      return stats
    }

    // 2. Process wines in batches of 10
    const BATCH_SIZE = 10
    for (let i = 0; i < winesWithRatings.length; i += BATCH_SIZE) {
      const batch = winesWithRatings.slice(i, i + BATCH_SIZE)
      console.log(`[EMBEDDING] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(winesWithRatings.length / BATCH_SIZE)}`)

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (wine) => {
          try {
            // Fetch wine knowledge if available
            const knowledge = await getWineKnowledge(wine.id)

            // Generate chunk text with knowledge and hash
            const chunkText = wineToChunkTextWithKnowledge(wine, knowledge)
            const contentHash = generateContentHash(chunkText)

            // Check if embedding exists with same hash
            const { data: existingEmbedding } = await supabaseAdmin
              .from('wine_embeddings')
              .select('content_hash')
              .eq('wine_id', wine.id)
              .single()

            if (existingEmbedding && existingEmbedding.content_hash === contentHash) {
              console.log(`[EMBEDDING] Wine ${wine.id} (${wine.name}) unchanged, skipping`)
              return { success: true, skipped: true }
            }

            // Generate embedding
            const embedding = await embedText(chunkText)

            // Upsert into wine_embeddings
            const { error: upsertError } = await supabaseAdmin
              .from('wine_embeddings')
              .upsert({
                wine_id: wine.id,
                venue_id: wine.venue_id,
                embedding: embedding,
                content_text: chunkText,
                content_hash: contentHash,
                wine_type: wine.wine_type,
                price: wine.price,
                available: wine.available,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'wine_id',
              })

            if (upsertError) {
              console.error(`[EMBEDDING] Failed to upsert embedding for wine ${wine.id}:`, upsertError)
              return { success: false, skipped: false }
            }

            console.log(`[EMBEDDING] Successfully embedded wine ${wine.id} (${wine.name})`)
            return { success: true, skipped: false }

          } catch (error) {
            console.error(`[EMBEDDING] Error processing wine ${wine.id}:`, error)
            return { success: false, skipped: false }
          }
        })
      )

      // Update stats
      batchResults.forEach((result) => {
        if (result.skipped) {
          stats.skipped++
        } else if (result.success) {
          stats.embedded++
        } else {
          stats.failed++
        }
      })
    }

    console.log(`[EMBEDDING] Venue ${venueId} embedding complete:`, stats)
    return stats

  } catch (error) {
    console.error(`[EMBEDDING] Error embedding venue wines ${venueId}:`, error)
    return stats
  }
}

// ============================================
// SMART SYNC
// ============================================

/**
 * Smart sync for a single wine.
 * Only re-embeds if content has changed (via hash comparison).
 *
 * @param wineId - Wine ID to sync
 * @returns true on success (including skipped), false on failure
 */
export async function syncEmbedding(wineId: string): Promise<boolean> {
  try {
    console.log(`[EMBEDDING] Syncing wine ${wineId}`)

    // 1. Fetch wine with ratings
    const { data: wine, error: wineError } = await supabaseAdmin
      .from('wines')
      .select(`
        *,
        ratings:wine_ratings(*)
      `)
      .eq('id', wineId)
      .single()

    if (wineError || !wine) {
      console.error(`[EMBEDDING] Failed to fetch wine ${wineId}:`, wineError)
      return false
    }

    const wineWithRatings = wine as unknown as WineWithRatings

    // 2. Fetch wine knowledge if available
    const knowledge = await getWineKnowledge(wineId)

    // 3. Generate new chunk text with knowledge and hash
    const chunkText = wineToChunkTextWithKnowledge(wineWithRatings, knowledge)
    const contentHash = generateContentHash(chunkText)

    // 4. Fetch current embedding
    const { data: existingEmbedding } = await supabaseAdmin
      .from('wine_embeddings')
      .select('content_hash')
      .eq('wine_id', wineId)
      .single()

    // 5. If hash matches → skip
    if (existingEmbedding && existingEmbedding.content_hash === contentHash) {
      console.log(`[EMBEDDING] Wine ${wineId} unchanged, skipping sync`)
      return true
    }

    // 6. Hash differs or no existing embedding → regenerate
    console.log(`[EMBEDDING] Wine ${wineId} changed, regenerating embedding`)
    const embedding = await embedText(chunkText)

    // 7. Upsert embedding
    const { error: upsertError } = await supabaseAdmin
      .from('wine_embeddings')
      .upsert({
        wine_id: wineId,
        venue_id: wine.venue_id,
        embedding: embedding,
        content_text: chunkText,
        content_hash: contentHash,
        wine_type: wine.wine_type,
        price: wine.price,
        available: wine.available,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wine_id',
      })

    if (upsertError) {
      console.error(`[EMBEDDING] Failed to sync embedding for wine ${wineId}:`, upsertError)
      return false
    }

    console.log(`[EMBEDDING] Successfully synced wine ${wineId}`)
    return true

  } catch (error) {
    console.error(`[EMBEDDING] Error syncing wine ${wineId}:`, error)
    return false
  }
}

// ============================================
// AVAILABILITY UPDATE (FAST PATH)
// ============================================

/**
 * Fast update for wine availability without re-embedding.
 * Used when toggling wine availability (no content change).
 *
 * @param wineId - Wine ID
 * @param available - New availability status
 * @returns true on success, false on failure
 */
export async function updateEmbeddingAvailability(
  wineId: string,
  available: boolean
): Promise<boolean> {
  try {
    console.log(`[EMBEDDING] Updating availability for wine ${wineId} to ${available}`)

    const { error } = await supabaseAdmin
      .from('wine_embeddings')
      .update({
        available,
        updated_at: new Date().toISOString(),
      })
      .eq('wine_id', wineId)

    if (error) {
      console.error(`[EMBEDDING] Failed to update availability for wine ${wineId}:`, error)
      return false
    }

    console.log(`[EMBEDDING] Successfully updated availability for wine ${wineId}`)
    return true

  } catch (error) {
    console.error(`[EMBEDDING] Error updating availability for wine ${wineId}:`, error)
    return false
  }
}

// ============================================
// DELETE EMBEDDING
// ============================================

/**
 * Deletes embedding when wine is deleted.
 *
 * @param wineId - Wine ID
 * @returns true on success, false on failure
 */
export async function deleteEmbedding(wineId: string): Promise<boolean> {
  try {
    console.log(`[EMBEDDING] Deleting embedding for wine ${wineId}`)

    const { error } = await supabaseAdmin
      .from('wine_embeddings')
      .delete()
      .eq('wine_id', wineId)

    if (error) {
      console.error(`[EMBEDDING] Failed to delete embedding for wine ${wineId}:`, error)
      return false
    }

    console.log(`[EMBEDDING] Successfully deleted embedding for wine ${wineId}`)
    return true

  } catch (error) {
    console.error(`[EMBEDDING] Error deleting embedding for wine ${wineId}:`, error)
    return false
  }
}
