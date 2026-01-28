import type { ChatMessage } from '@/types'
import type { ChatSession, ChatSessionCreate, ChatSessionSummary } from '@/types/user'

// ============================================
// SESSION SYNC UTILITIES
// ============================================

const SYNC_DEBOUNCE_MS = 5000 // 5 seconds
const MIN_MESSAGES_TO_SYNC = 3 // Don't sync very short conversations

// Track pending syncs
let syncTimeout: NodeJS.Timeout | null = null
let pendingSessionId: string | null = null

/**
 * Generate a summary from chat messages
 * This is a lightweight client-side summary, full analysis happens server-side
 */
export function generateSessionSummary(messages: ChatMessage[]): ChatSessionSummary {
  const winesDiscussed: string[] = []
  const topics: string[] = []

  // Simple extraction of wine names mentioned
  const winePatterns = [
    /(?:Barolo|Barbaresco|Brunello|Chianti|Amarone|Prosecco|Franciacorta)/gi,
    /(?:Nebbiolo|Sangiovese|Montepulciano|Primitivo|Nero d'Avola)/gi,
  ]

  messages.forEach(msg => {
    if (msg.role === 'assistant') {
      winePatterns.forEach(pattern => {
        const matches = msg.content.match(pattern)
        if (matches) {
          matches.forEach(match => {
            if (!winesDiscussed.includes(match)) {
              winesDiscussed.push(match)
            }
          })
        }
      })
    }
  })

  // Extract general topic from first user message
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.toLowerCase()
    if (content.includes('rosso') || content.includes('red')) topics.push('vino rosso')
    if (content.includes('bianco') || content.includes('white')) topics.push('vino bianco')
    if (content.includes('bollicine') || content.includes('spumante')) topics.push('spumante')
    if (content.includes('cena') || content.includes('pranzo')) topics.push('abbinamento cibo')
    if (content.includes('regalo') || content.includes('occasione')) topics.push('occasione speciale')
  }

  return {
    topic: topics.join(', ') || 'conversazione generale',
    wines_discussed: winesDiscussed.slice(0, 10), // Max 10 wines
  }
}

/**
 * Extract wine names mentioned in messages
 */
export function extractWinesMentioned(messages: ChatMessage[]): string[] {
  const wines: Set<string> = new Set()

  // Common Italian wine names and grape varieties
  const wineNames = [
    'Barolo', 'Barbaresco', 'Brunello', 'Chianti', 'Amarone', 'Valpolicella',
    'Prosecco', 'Franciacorta', 'Lugana', 'Vermentino', 'Gewurztraminer',
    'Montepulciano', 'Primitivo', 'Nero d\'Avola', 'Nebbiolo', 'Sangiovese',
    'Pinot Grigio', 'Pinot Nero', 'Trebbiano', 'Lambrusco', 'Moscato',
  ]

  messages.forEach(msg => {
    wineNames.forEach(wine => {
      if (msg.content.toLowerCase().includes(wine.toLowerCase())) {
        wines.add(wine)
      }
    })
  })

  return Array.from(wines)
}

/**
 * Create or update a chat session on the server
 */
export async function syncSessionToServer(params: {
  sessionId: string | null
  venueId: string | null
  messages: ChatMessage[]
  ended?: boolean
}): Promise<string | null> {
  const { sessionId, venueId, messages, ended } = params

  if (messages.length < MIN_MESSAGES_TO_SYNC) {
    return sessionId
  }

  try {
    const summary = generateSessionSummary(messages)
    const winesMentioned = extractWinesMentioned(messages)

    const body: ChatSessionCreate & { id?: string; ended_at?: string } = {
      venue_id: venueId,
      summary,
      message_count: messages.length,
      wines_mentioned: winesMentioned,
    }

    if (sessionId) {
      body.id = sessionId
    }
    if (ended) {
      body.ended_at = new Date().toISOString()
    }

    const response = await fetch('/api/chat-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Session sync failed:', response.status)
      return sessionId
    }

    const data = await response.json()
    return data.session?.id || sessionId
  } catch (error) {
    console.error('Session sync error:', error)
    return sessionId
  }
}

/**
 * Debounced session sync - call this after each message
 */
export function debouncedSessionSync(params: {
  sessionId: string | null
  venueId: string | null
  messages: ChatMessage[]
  onSessionCreated?: (sessionId: string) => void
}) {
  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }

  // Store pending session ID
  pendingSessionId = params.sessionId

  // Set new timeout
  syncTimeout = setTimeout(async () => {
    const newSessionId = await syncSessionToServer({
      ...params,
      sessionId: pendingSessionId,
    })

    if (newSessionId && newSessionId !== pendingSessionId) {
      pendingSessionId = newSessionId
      params.onSessionCreated?.(newSessionId)
    }

    syncTimeout = null
  }, SYNC_DEBOUNCE_MS)
}

/**
 * Force sync now (e.g., when user leaves the page)
 */
export async function forceSyncSession(params: {
  sessionId: string | null
  venueId: string | null
  messages: ChatMessage[]
  ended?: boolean
}): Promise<string | null> {
  // Clear any pending debounced sync
  if (syncTimeout) {
    clearTimeout(syncTimeout)
    syncTimeout = null
  }

  return syncSessionToServer({ ...params, sessionId: pendingSessionId || params.sessionId })
}

/**
 * Fetch user's recent chat sessions
 */
export async function fetchUserSessions(limit = 10): Promise<ChatSession[]> {
  try {
    const response = await fetch(`/api/chat-session?limit=${limit}`)
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.sessions || []
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return []
  }
}
