'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage as MessageType } from '@/types'

interface ChatMessagesProps {
  messages: MessageType[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserAtBottom = useRef(true)
  const prevMessagesLength = useRef(messages.length)

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
          />
        ))}
      </AnimatePresence>

      <TypingIndicator visible={isLoading} />

      <div ref={bottomRef} />
    </div>
  )
}
