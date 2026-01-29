import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm'
import { getVenueBySlug, getWinesWithRatings } from '@/lib/supabase'
import {
  SYSTEM_PROMPT_GENERAL,
  getVenueSystemPrompt,
  buildChatMessages,
} from '@/lib/prompts'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { ChatMessage } from '@/types'

interface ChatRequest {
  message: string
  venue_slug?: string
  history?: ChatMessage[]
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
      systemPrompt = getVenueSystemPrompt(venue.name, wines)
      venueName = venue.name
      mode = 'venue'
    } else {
      systemPrompt = SYSTEM_PROMPT_GENERAL
    }

    // Build messages array with history
    const messages = buildChatMessages(
      body.message,
      systemPrompt,
      body.history || []
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
