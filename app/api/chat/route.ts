import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm'
import { getVenueBySlug, getWinesWithRatings } from '@/lib/supabase'
import {
  SYSTEM_PROMPT_GENERAL,
  getVenueSystemPrompt,
  getVenueSystemPromptRAG,
  buildChatMessages,
} from '@/lib/prompts'
import { searchWinesRAG } from '@/lib/rag'
import { parseQueryIntent } from '@/lib/query-parser'
import { isEmbeddingAvailable } from '@/lib/embeddings'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { RAG_THRESHOLD, RAG_TOP_K, RAG_SIMILARITY_THRESHOLD } from '@/config/constants'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { retrieveRelevantMemories, formatMemoriesForPrompt } from '@/lib/memory'
import type { ChatMessage } from '@/types'

// Security constants for chat history validation
const MAX_HISTORY_MESSAGES = 20 // Limit conversation history
const MAX_MESSAGE_LENGTH = 4000 // Max chars per message
const VALID_ROLES = ['user', 'assistant'] as const

interface ChatRequest {
  message: string
  venue_slug?: string
  history?: ChatMessage[]
}

/**
 * Sanitize and validate chat history to prevent prompt injection
 * - Only allow 'user' and 'assistant' roles (no 'system')
 * - Limit message length
 * - Limit total history length
 */
function sanitizeChatHistory(history: unknown): ChatMessage[] {
  if (!history || !Array.isArray(history)) {
    return []
  }

  return history
    .filter((msg): msg is ChatMessage => {
      // Must be an object with role and content
      if (!msg || typeof msg !== 'object') return false
      if (!('role' in msg) || !('content' in msg)) return false

      // Role must be 'user' or 'assistant' (never 'system')
      if (!VALID_ROLES.includes(msg.role as typeof VALID_ROLES[number])) return false

      // Content must be a non-empty string
      if (typeof msg.content !== 'string' || !msg.content.trim()) return false

      return true
    })
    .slice(-MAX_HISTORY_MESSAGES) // Keep only last N messages
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      // Truncate overly long messages
      content: msg.content.slice(0, MAX_MESSAGE_LENGTH),
    }))
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`chat:${clientId}`, RATE_LIMITS.chat)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetIn),
        },
      }
    )
  }

  try {
    const body: ChatRequest = await request.json()

    // Validate message
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (body.message.length > 2000) {
      return NextResponse.json(
        { error: 'Il messaggio è troppo lungo (max 2000 caratteri).' },
        { status: 400 }
      )
    }

    let systemPrompt: string
    let venueName: string | undefined
    let mode: 'general' | 'venue' = 'general'

    // Determine mode: venue-specific or general
    if (body.venue_slug) {
      const venue = await getVenueBySlug(body.venue_slug)
      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found' },
          { status: 404 }
        )
      }

      // Get only available wines with ratings for venue mode (RULE-001)
      const wines = await getWinesWithRatings(venue.id, true)

      // Decision: RAG path for large catalogs, full context for small ones (RULE-008)
      if (wines.length > RAG_THRESHOLD && isEmbeddingAvailable()) {
        // RAG path: parse query → semantic search → build compact prompt
        const intent = parseQueryIntent(body.message)
        const ragResult = await searchWinesRAG({
          venueId: venue.id,
          query: body.message,
          topK: RAG_TOP_K,
          threshold: RAG_SIMILARITY_THRESHOLD,
          onlyAvailable: true,
          wineType: intent.wineType,
          maxPrice: intent.maxPrice,
          minPrice: intent.minPrice,
        })

        console.log(`[CHAT] RAG path: ${wines.length} total wines, ${ragResult.totalMatched} matched in ${ragResult.searchTimeMs}ms`)

        // Fallback to full context if RAG returns 0 results (e.g. embeddings not generated yet)
        if (ragResult.totalMatched === 0) {
          console.log('[CHAT] RAG returned 0 results, falling back to full context')
          systemPrompt = getVenueSystemPrompt(venue.name, wines)
        } else {
          systemPrompt = getVenueSystemPromptRAG(venue.name, ragResult.ragContext, wines.length)
        }
      } else {
        // Full context path: all wines fit in prompt
        systemPrompt = getVenueSystemPrompt(venue.name, wines)
      }

      venueName = venue.name
      mode = 'venue'
    } else {
      systemPrompt = SYSTEM_PROMPT_GENERAL
    }

    // Inject user memories if authenticated + consented (RULE-009)
    if (isEmbeddingAvailable()) {
      try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('profiling_consent')
            .eq('user_id', user.id)
            .single()

          if (profile?.profiling_consent) {
            const memories = await retrieveRelevantMemories(user.id, body.message)
            const memorySection = formatMemoriesForPrompt(memories)
            if (memorySection) {
              systemPrompt += '\n\n' + memorySection
              console.log(`[MEMORY] Injected ${memories.length} memories into prompt`)
            }
          }
        }
      } catch (err) {
        // Memory retrieval is non-critical, don't fail the chat
        console.error('[MEMORY] Failed to retrieve memories:', err)
      }
    }

    // Sanitize and validate history to prevent prompt injection
    const sanitizedHistory = sanitizeChatHistory(body.history)

    // Build messages array with validated history
    const messages = buildChatMessages(
      body.message,
      systemPrompt,
      sanitizedHistory
    )

    // Call LLM
    const response = await chat(messages)

    return NextResponse.json({
      message: response.content,
      mode,
      venue_name: venueName,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
