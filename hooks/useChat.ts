'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from '@/contexts/session-context'
import { useUserOptional } from '@/contexts/user-context'
import { debouncedSessionSync, forceSyncSession } from '@/lib/session-sync'
import type { ChatMessage } from '@/types'

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

export function useChat(): UseChatReturn {
  // Get messages and actions from session context
  const { messages, venueSlug, venueData, addMessage, clearConversation } = useSession()

  // Get user context (optional - may not be authenticated)
  const userContext = useUserOptional()
  const isAuthenticated = userContext?.isAuthenticated ?? false
  const hasProfilingConsent = userContext?.profile?.profiling_consent ?? false

  // Transient state (not persisted)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Session sync state
  const serverSessionId = useRef<string | null>(null)

  // Sync session to server when messages change (for authenticated users with consent)
  useEffect(() => {
    if (!isAuthenticated || !hasProfilingConsent || messages.length < 3) {
      return
    }

    debouncedSessionSync({
      sessionId: serverSessionId.current,
      venueId: venueData?.id ?? null,
      messages,
      onSessionCreated: (id) => {
        serverSessionId.current = id
      },
    })
  }, [messages, isAuthenticated, hasProfilingConsent, venueData?.id])

  // Force sync when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && hasProfilingConsent && messages.length >= 3) {
        // Use sendBeacon for reliable delivery on page close
        const data = JSON.stringify({
          id: serverSessionId.current,
          venue_id: venueData?.id ?? null,
          message_count: messages.length,
          ended_at: new Date().toISOString(),
        })
        navigator.sendBeacon('/api/chat-session', data)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Sync on unmount
      if (isAuthenticated && hasProfilingConsent && messages.length >= 3) {
        forceSyncSession({
          sessionId: serverSessionId.current,
          venueId: venueData?.id ?? null,
          messages,
          ended: true,
        })
      }
    }
  }, [isAuthenticated, hasProfilingConsent, messages, venueData?.id])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      // Add user message to session
      const userMessage: ChatMessage = { role: 'user', content }
      addMessage(userMessage)
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

        // Add assistant message to session
        addMessage(assistantMessage)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, venueSlug, addMessage]
  )

  const clearChat = useCallback(() => {
    // End current server session before clearing
    if (isAuthenticated && hasProfilingConsent && serverSessionId.current) {
      forceSyncSession({
        sessionId: serverSessionId.current,
        venueId: venueData?.id ?? null,
        messages,
        ended: true,
      })
      serverSessionId.current = null
    }
    clearConversation()
    setError(null)
  }, [clearConversation, isAuthenticated, hasProfilingConsent, messages, venueData?.id])

  return { messages, isLoading, error, sendMessage, clearChat }
}
