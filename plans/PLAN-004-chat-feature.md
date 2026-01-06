# PLAN-004: Chat Feature Implementation

## Status
- [x] Draft
- [ ] Under Review
- [ ] Approved
- [ ] In Progress
- [ ] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2025-01-02 |
| Type | feature |
| Priority | P0 |
| Dependencies | PLAN-002, PLAN-003 |

---

## 1. Summary

Implement the core chat feature allowing users to interact with WYN AI sommelier. Supports two modes: general chat (wine advice) and venue chat (restaurant-specific recommendations).

---

## 2. Goals

- Create chat API endpoint handling both modes
- Implement chat UI following mockups
- Support conversation history (in-memory for MVP)
- Enforce business rules (RULE-001 to RULE-004)
- Provide quick suggestion prompts

---

## 3. Non-Goals

- Voice input (future feature)
- Persistent conversation storage (future)
- Multi-language support (Italian only for MVP)

---

## 4. Affected Areas

| Area | Impact |
|------|--------|
| `app/api/chat/route.ts` | Chat API endpoint |
| `app/page.tsx` | Home page with chat |
| `app/chat/page.tsx` | Full chat page |
| `app/v/[slug]/page.tsx` | Venue-specific chat |
| `components/chat/*` | Chat UI components |
| `hooks/useChat.ts` | Chat state management |

---

## 5. Technical Design

### 5.1 API Endpoint

**POST `/api/chat`**

```typescript
// Request
interface ChatRequest {
  message: string
  venue_slug?: string    // If provided, venue mode
  history?: ChatMessage[] // Previous messages
}

// Response (200)
interface ChatResponse {
  message: string
  mode: 'general' | 'venue'
  venue_name?: string
}

// Response (400)
interface ChatErrorResponse {
  error: string
}

// Response (404) - Venue not found
interface VenueNotFoundResponse {
  error: 'Venue not found'
}
```

**Implementation:**

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/llm'
import { getVenueBySlug, getWinesByVenue } from '@/lib/supabase'
import {
  SYSTEM_PROMPT_GENERAL,
  getVenueSystemPrompt,
  buildChatMessages
} from '@/lib/prompts'
import type { ChatRequest, ChatMessage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    // Validate
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let systemPrompt: string
    let venueName: string | undefined
    let mode: 'general' | 'venue' = 'general'

    // Determine mode
    if (body.venue_slug) {
      const venue = await getVenueBySlug(body.venue_slug)
      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found' },
          { status: 404 }
        )
      }

      const wines = await getWinesByVenue(venue.id, true) // Only available
      systemPrompt = getVenueSystemPrompt(venue.name, wines)
      venueName = venue.name
      mode = 'venue'
    } else {
      systemPrompt = SYSTEM_PROMPT_GENERAL
    }

    // Build messages
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
```

### 5.2 Chat Hook

```typescript
// hooks/useChat.ts
'use client'

import { useState, useCallback } from 'react'
import type { ChatMessage } from '@/types'

interface UseChatOptions {
  venueSlug?: string
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

export function useChat({ venueSlug }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          venue_slug: venueSlug,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, venueSlug])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
```

### 5.3 Chat Components

**Component Structure:**

```
components/chat/
├── ChatContainer.tsx    # Main chat wrapper
├── ChatInput.tsx        # Input with send button
├── ChatMessages.tsx     # Message list
├── ChatMessage.tsx      # Single message bubble
├── QuickSuggestions.tsx # Prompt suggestions
└── ModeToggle.tsx       # Chat/Venue switch
```

**ChatContainer:**

```typescript
// components/chat/ChatContainer.tsx
'use client'

import { useChat } from '@/hooks/useChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { QuickSuggestions } from './QuickSuggestions'

interface ChatContainerProps {
  venueSlug?: string
  venueName?: string
}

export function ChatContainer({ venueSlug, venueName }: ChatContainerProps) {
  const { messages, isLoading, error, sendMessage } = useChat({ venueSlug })

  const suggestions = venueSlug
    ? ['Cosa mi consigli con il pesce?', 'Un rosso corposo sotto i 50€', 'Bollicine per festeggiare']
    : ['Rosso per la carne', 'Vini sotto 30€', 'Bollicine aperitivo']

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={sendMessage}
          />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-400 bg-red-900/20">
          {error}
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        placeholder={
          venueSlug
            ? `Chiedimi dei vini di ${venueName || 'questo ristorante'}...`
            : 'Chiedimi qualsiasi cosa sul vino...'
        }
      />
    </div>
  )
}
```

**ChatInput:**

```typescript
// components/chat/ChatInput.tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder: string
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-secondary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Premi Invio per inviare
      </p>
    </div>
  )
}
```

**ChatMessage:**

```typescript
// components/chat/ChatMessage.tsx
import { cn } from '@/lib/utils'
import type { ChatMessage as MessageType } from '@/types'

interface ChatMessageProps {
  message: MessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
```

**QuickSuggestions:**

```typescript
// components/chat/QuickSuggestions.tsx
interface QuickSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function QuickSuggestions({ suggestions, onSelect }: QuickSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center p-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="px-4 py-2 text-sm border border-border rounded-full hover:bg-secondary transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
```

### 5.4 Page Implementations

**Home Page (`app/page.tsx`):**

```typescript
import Link from 'next/link'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Wine } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Wine className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-5xl font-bold mb-2">WYN</h1>
        <p className="text-muted-foreground mb-8">
          Il tuo sommelier AI personale
        </p>

        {/* Chat container */}
        <div className="w-full max-w-2xl">
          <ChatContainer />
        </div>
      </div>

      {/* Footer links */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
      </footer>
    </main>
  )
}
```

**Venue Page (`app/v/[slug]/page.tsx`):**

```typescript
import { notFound } from 'next/navigation'
import { getVenueBySlug } from '@/lib/supabase'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Wine } from 'lucide-react'

interface VenuePageProps {
  params: { slug: string }
}

export default async function VenuePage({ params }: VenuePageProps) {
  const venue = await getVenueBySlug(params.slug)

  if (!venue) {
    notFound()
  }

  return (
    <main className="flex flex-col min-h-screen">
      <header className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Wine className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">{venue.name}</h1>
            <p className="text-xs text-muted-foreground">Powered by WYN</p>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <ChatContainer
          venueSlug={params.slug}
          venueName={venue.name}
        />
      </div>
    </main>
  )
}
```

---

## 6. Business Rules Enforcement

| Rule | How Enforced |
|------|--------------|
| RULE-001: Only available wines | `getWinesByVenue(id, true)` filters |
| RULE-002: No invented wines | System prompt strictly limits to list |
| RULE-003: Always mention prices | Prompt instruction + wine format includes price |
| RULE-004: No prices in general | General prompt has no price data |

---

## 7. Implementation Steps

### Backend (AGENT_IMPLEMENTER_BE)
1. [ ] Implement `app/api/chat/route.ts`
2. [ ] Test API with curl/Postman
3. [ ] Verify venue mode loads correct wines
4. [ ] Verify error handling

### Frontend (AGENT_IMPLEMENTER_FE)
5. [ ] Create `hooks/useChat.ts`
6. [ ] Create `components/chat/ChatContainer.tsx`
7. [ ] Create `components/chat/ChatInput.tsx`
8. [ ] Create `components/chat/ChatMessage.tsx`
9. [ ] Create `components/chat/ChatMessages.tsx`
10. [ ] Create `components/chat/QuickSuggestions.tsx`
11. [ ] Update `app/page.tsx`
12. [ ] Update `app/v/[slug]/page.tsx`
13. [ ] Apply mockup styling (PLAN-007)

---

## 8. Test Strategy

- **API Unit Test:** Mock LLM, test request/response
- **Hook Test:** Mock fetch, test state transitions
- **E2E Test:** Send message, verify response appears
- **Business Rules:** Verify venue mode only shows available wines

---

## 9. Rollback Plan

1. Revert API route and components
2. No database changes
3. No breaking changes to other features

---

## 10. Review Checklist

- [ ] API handles both modes correctly
- [ ] Business rules RULE-001 to RULE-004 enforced
- [ ] Error states handled in UI
- [ ] Loading states visible
- [ ] Messages display correctly
- [ ] Quick suggestions work

---

**This is the core feature of WYN.**
