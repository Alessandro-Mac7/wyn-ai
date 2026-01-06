'use client'

import { useState, useCallback } from 'react'
import { useSession } from '@/contexts/session-context'
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
  const { messages, venueSlug, addMessage, clearConversation } = useSession()

  // Transient state (not persisted)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    clearConversation()
    setError(null)
  }, [clearConversation])

  return { messages, isLoading, error, sendMessage, clearChat }
}
