/**
 * Memory extraction and retrieval module
 * Manages user wine preferences and context from conversations
 *
 * RULE-009: Only for authenticated users with profiling_consent=true
 */

import { chat } from './llm'
import { embedText, isEmbeddingAvailable } from './embeddings'
import { supabaseAdmin } from './supabase-auth-server'
import {
  MEMORY_SIMILARITY_THRESHOLD,
  MEMORY_DEDUP_THRESHOLD,
  MEMORY_TOP_K,
  ENRICHMENT_MAX_RETRIES,
  ENRICHMENT_RETRY_DELAY_MS,
} from '@/config/constants'
import type {
  MemoryFragment,
  MemoryFragmentCreate,
  MemoryFragmentType,
} from '@/types/user'
import type { ChatMessage, LLMResponse } from '@/types'

// ============================================
// TYPES
// ============================================

interface ExtractedFragment {
  fragment_type: MemoryFragmentType
  content: string
  metadata: Record<string, unknown>
}

interface RawMemoryMatch {
  id: string
  user_id: string
  fragment_type: string
  content: string
  metadata: Record<string, unknown>
  weight: number
  last_relevant_at: string
  source_session_id: string | null
  source_venue_id: string | null
  created_at: string
  updated_at: string
  similarity: number
}

// ============================================
// RETRY HELPER
// ============================================

async function chatWithRetry(
  messages: ChatMessage[],
  maxRetries: number = ENRICHMENT_MAX_RETRIES
): Promise<LLMResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chat(messages)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on 4xx errors (client errors)
      if (
        lastError.message.includes('400') ||
        lastError.message.includes('401') ||
        lastError.message.includes('403')
      ) {
        throw lastError
      }

      // Last attempt, throw the error
      if (attempt === maxRetries - 1) {
        break
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = ENRICHMENT_RETRY_DELAY_MS * Math.pow(2, attempt)
      console.error(
        `[MEMORY] LLM call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Memory extraction failed after retries')
}

// ============================================
// EXTRACTION PROMPT
// ============================================

function buildExtractionPrompt(conversationText: string): string {
  return `Analizza questa conversazione e estrai i "ricordi" dell'utente sui vini.

CONVERSAZIONE:
${conversationText}

Estrai SOLO informazioni esplicite o chiaramente implicite. Per ogni ricordo, indica:
- fragment_type: "preference" | "purchase" | "feedback" | "context" | "dislike" | "occasion"
  * preference: vini che piacciono all'utente
  * purchase: intenzioni di acquisto o acquisti effettuati
  * feedback: giudizi su vini specifici
  * context: informazioni contestuali (es. "preferisco vini per cena")
  * dislike: vini o caratteristiche che NON piacciono
  * occasion: occasioni d'uso (es. "per un anniversario")

- content: descrizione concisa del ricordo (max 200 caratteri)
- metadata: oggetto con campi rilevanti (wine_name, wine_type, region, grape, price, occasion, venue_name)

Rispondi SOLO con un JSON array:
[
  { "fragment_type": "...", "content": "...", "metadata": {...} }
]

Se non ci sono ricordi da estrarre, rispondi con [].`
}

// ============================================
// MEMORY EXTRACTION (Task 19)
// ============================================

/**
 * Extract memory fragments from a conversation using LLM.
 * Only for authenticated users with profiling_consent=true (RULE-009).
 */
export async function extractMemories(
  messages: ChatMessage[],
  userId: string,
  sessionId?: string,
  venueId?: string
): Promise<MemoryFragment[]> {
  try {
    // Build conversation summary (only user + assistant, skip system)
    const conversationText = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role === 'user' ? 'Utente' : 'Assistente'}: ${m.content}`)
      .join('\n\n')

    if (!conversationText.trim()) {
      console.log('[MEMORY] No conversation to extract from')
      return []
    }

    // Call LLM to extract memories
    console.log('[MEMORY] Extracting memories from conversation...')
    const prompt = buildExtractionPrompt(conversationText)
    const response = await chatWithRetry([
      {
        role: 'system',
        content:
          'Sei un assistente che estrae informazioni strutturate. Rispondi SOLO con JSON valido.',
      },
      { role: 'user', content: prompt },
    ])

    // Parse JSON response
    let extracted: ExtractedFragment[] = []
    try {
      // Clean response - remove markdown code blocks if present
      let cleanContent = response.content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }

      extracted = JSON.parse(cleanContent)

      if (!Array.isArray(extracted)) {
        console.error('[MEMORY] LLM response is not an array:', cleanContent)
        return []
      }
    } catch (parseError) {
      console.error('[MEMORY] Failed to parse LLM response:', response.content)
      return []
    }

    console.log(`[MEMORY] Extracted ${extracted.length} potential fragments`)

    // Process each fragment
    const createdFragments: MemoryFragment[] = []

    for (const fragment of extracted) {
      try {
        // Validate fragment structure
        if (
          !fragment.fragment_type ||
          !fragment.content ||
          typeof fragment.content !== 'string'
        ) {
          console.warn('[MEMORY] Invalid fragment structure, skipping:', fragment)
          continue
        }

        // Limit content length
        const content =
          fragment.content.length > 200
            ? fragment.content.substring(0, 197) + '...'
            : fragment.content

        // Check for semantic duplicates
        const isDuplicate = await checkForDuplicate(userId, content)

        if (isDuplicate) {
          console.log('[MEMORY] Duplicate fragment found, updating existing:', content)
          // Bump weight and last_relevant_at on existing fragment
          await bumpExistingFragment(userId, content)
          continue
        }

        // Create new fragment
        const embedding = await embedText(content)

        const { data: created, error } = await supabaseAdmin
          .from('memory_fragments')
          .insert({
            user_id: userId,
            fragment_type: fragment.fragment_type,
            content,
            metadata: fragment.metadata || {},
            weight: 1.0, // Start at max weight
            last_relevant_at: new Date().toISOString(),
            source_session_id: sessionId || null,
            source_venue_id: venueId || null,
            embedding: JSON.stringify(embedding),
          })
          .select()
          .single()

        if (error) {
          console.error('[MEMORY] Failed to create fragment:', error)
          continue
        }

        if (created) {
          createdFragments.push({
            id: created.id,
            user_id: created.user_id,
            fragment_type: created.fragment_type as MemoryFragmentType,
            content: created.content,
            metadata: created.metadata,
            weight: created.weight,
            last_relevant_at: created.last_relevant_at,
            source_session_id: created.source_session_id,
            source_venue_id: created.source_venue_id,
            created_at: created.created_at,
            updated_at: created.updated_at,
          })
          console.log(`[MEMORY] Created fragment: ${content.substring(0, 50)}...`)
        }
      } catch (fragmentError) {
        console.error('[MEMORY] Error processing fragment:', fragmentError)
        continue
      }
    }

    console.log(`[MEMORY] Successfully created ${createdFragments.length} fragments`)
    return createdFragments
  } catch (error) {
    console.error('[MEMORY] Failed to extract memories:', error)
    return []
  }
}

/**
 * Check if a similar fragment already exists for this user
 */
async function checkForDuplicate(userId: string, content: string): Promise<boolean> {
  try {
    if (!isEmbeddingAvailable()) {
      return false
    }

    const embedding = await embedText(content)

    const { data, error } = await supabaseAdmin.rpc('match_memories', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: userId,
      match_threshold: MEMORY_DEDUP_THRESHOLD,
      match_count: 1,
      filter_fragment_type: null,
    })

    if (error) {
      console.error('[MEMORY] Error checking duplicates:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('[MEMORY] Error in duplicate check:', error)
    return false
  }
}

/**
 * Bump weight and last_relevant_at on an existing fragment
 */
async function bumpExistingFragment(userId: string, content: string): Promise<void> {
  try {
    if (!isEmbeddingAvailable()) {
      return
    }

    const embedding = await embedText(content)

    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      'match_memories',
      {
        query_embedding: JSON.stringify(embedding),
        match_user_id: userId,
        match_threshold: MEMORY_DEDUP_THRESHOLD,
        match_count: 1,
        filter_fragment_type: null,
      }
    )

    if (matchError || !matches || matches.length === 0) {
      return
    }

    const existingId = matches[0].id

    // Bump weight (capped at 1.0) and update last_relevant_at
    const { error: updateError } = await supabaseAdmin
      .from('memory_fragments')
      .update({
        weight: Math.min(matches[0].weight + 0.1, 1.0),
        last_relevant_at: new Date().toISOString(),
      })
      .eq('id', existingId)

    if (updateError) {
      console.error('[MEMORY] Error bumping fragment:', updateError)
    }
  } catch (error) {
    console.error('[MEMORY] Error in bump operation:', error)
  }
}

// ============================================
// MEMORY RETRIEVAL (Task 21)
// ============================================

/**
 * Retrieve relevant memories for a user based on query.
 * Bumps last_relevant_at on retrieved memories.
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  topK: number = MEMORY_TOP_K
): Promise<MemoryFragment[]> {
  try {
    // Check if embedding is available
    if (!isEmbeddingAvailable()) {
      console.log('[MEMORY] Embeddings not available, skipping retrieval')
      return []
    }

    // Embed the query
    console.log('[MEMORY] Retrieving memories for query...')
    const embedding = await embedText(query)

    // Call match_memories RPC
    const { data, error } = await supabaseAdmin.rpc('match_memories', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: userId,
      match_threshold: MEMORY_SIMILARITY_THRESHOLD,
      match_count: topK,
      filter_fragment_type: null,
    })

    if (error) {
      console.error('[MEMORY] Error retrieving memories:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('[MEMORY] No relevant memories found')
      return []
    }

    console.log(`[MEMORY] Found ${data.length} relevant memories`)

    // Map raw results to MemoryFragment type
    const memories: MemoryFragment[] = (data as RawMemoryMatch[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      fragment_type: row.fragment_type as MemoryFragmentType,
      content: row.content,
      metadata: row.metadata,
      weight: row.weight,
      last_relevant_at: row.last_relevant_at,
      source_session_id: row.source_session_id,
      source_venue_id: row.source_venue_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    // Bump last_relevant_at on all retrieved fragments
    await bumpRetrievedMemories(memories.map((m) => m.id))

    return memories
  } catch (error) {
    console.error('[MEMORY] Failed to retrieve memories:', error)
    return []
  }
}

/**
 * Bump last_relevant_at on retrieved memories to prevent decay
 */
async function bumpRetrievedMemories(memoryIds: string[]): Promise<void> {
  try {
    if (memoryIds.length === 0) return

    const { error } = await supabaseAdmin
      .from('memory_fragments')
      .update({ last_relevant_at: new Date().toISOString() })
      .in('id', memoryIds)

    if (error) {
      console.error('[MEMORY] Error bumping retrieved memories:', error)
    }
  } catch (error) {
    console.error('[MEMORY] Error in bump operation:', error)
  }
}

// ============================================
// FORMATTING HELPER
// ============================================

/**
 * Format memory fragments into a prompt section for the LLM.
 */
export function formatMemoriesForPrompt(memories: MemoryFragment[]): string {
  if (!memories || memories.length === 0) {
    return ''
  }

  // Group by fragment_type
  const grouped: Record<string, MemoryFragment[]> = {}

  for (const memory of memories) {
    if (!grouped[memory.fragment_type]) {
      grouped[memory.fragment_type] = []
    }
    grouped[memory.fragment_type].push(memory)
  }

  // Format each group
  const sections: string[] = []

  const typeLabels: Record<string, string> = {
    preference: 'Preferenze',
    dislike: 'Non gradisce',
    purchase: 'Intenzioni di acquisto',
    feedback: 'Feedback su vini',
    context: 'Contesto',
    occasion: 'Occasioni',
  }

  for (const [type, fragments] of Object.entries(grouped)) {
    const label = typeLabels[type] || type
    const items = fragments
      .map((f) => {
        let text = `- ${f.content}`
        // Add relevant metadata if present
        if (f.metadata.wine_name) {
          text += ` (${f.metadata.wine_name})`
        }
        if (f.metadata.venue_name) {
          text += ` @ ${f.metadata.venue_name}`
        }
        return text
      })
      .join('\n')

    sections.push(`**${label}:**\n${items}`)
  }

  return `## Ricordi dell'utente\n\n${sections.join('\n\n')}`
}
