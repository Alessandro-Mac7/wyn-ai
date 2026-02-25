'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage as MessageType } from '@/types'

interface ChatMessagesProps {
  messages: MessageType[]
  isLoading: boolean
  mode?: 'general' | 'venue'
  onCtaAction?: (action: 'scan-qr' | 'discover-venues') => void
}

export function ChatMessages({ messages, isLoading, mode, onCtaAction }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserAtBottom = useRef(true)
  const prevMessagesLength = useRef(messages.length)

  // Calculate CTA logic: show on every 3rd assistant message (but not first message)
  const shouldShowCta = useCallback((message: MessageType, index: number): boolean => {
    // Only in general mode
    if (mode !== 'general') return false
    // Only on assistant messages
    if (message.role !== 'assistant') return false
    // Not during loading
    if (isLoading) return false
    // Not on first message (index 0)
    if (index === 0) return false

    // Count how many assistant messages we've seen up to this point
    const assistantMessagesSoFar = messages.slice(0, index + 1).filter(m => m.role === 'assistant').length

    // Show CTA on every 3rd assistant message (3, 6, 9, etc.)
    return assistantMessagesSoFar > 0 && assistantMessagesSoFar % 3 === 0
  }, [mode, isLoading, messages])

  // Alternate CTA variants: 3rd message = scan-qr, 6th = discover-venues, 9th = scan-qr, etc.
  const getCtaVariant = useCallback((message: MessageType, index: number): 'scan-qr' | 'discover-venues' | undefined => {
    if (!shouldShowCta(message, index)) return undefined

    const assistantMessagesSoFar = messages.slice(0, index + 1).filter(m => m.role === 'assistant').length
    const ctaCount = Math.floor(assistantMessagesSoFar / 3)

    // Alternate: odd CTA count = scan-qr, even = discover-venues
    return ctaCount % 2 === 1 ? 'scan-qr' : 'discover-venues'
  }, [shouldShowCta, messages])

  // Track if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current
    // Consider "at bottom" if within 100px of bottom
    isUserAtBottom.current = scrollHeight - scrollTop - clientHeight < 100
  }, [])

  // Auto-scroll only when new messages arrive AND user is at bottom
  useEffect(() => {
    // Only scroll if new message added (not on initial load or loading state change)
    const hasNewMessage = messages.length > prevMessagesLength.current
    prevMessagesLength.current = messages.length

    if (hasNewMessage && isUserAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [messages])

  // Scroll to bottom when loading starts (typing indicator appears)
  useEffect(() => {
    if (isLoading && isUserAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isLoading])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col gap-4 py-3 sm:py-4"
      role="log"
      aria-label="Conversazione"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.role}-${index}`}
            message={message}
            isNew={index === messages.length - 1}
            showCta={shouldShowCta(message, index)}
            ctaVariant={getCtaVariant(message, index)}
            onCtaAction={onCtaAction}
          />
        ))}
      </AnimatePresence>

      <TypingIndicator visible={isLoading} />

      <div ref={bottomRef} />
    </div>
  )
}
