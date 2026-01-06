'use client'

import { motion } from 'framer-motion'
import { Wine, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messageVariants } from '@/lib/motion'
import type { ChatMessage as MessageType } from '@/types'

interface ChatMessageProps {
  message: MessageType
  isNew?: boolean
}

// Format timestamp
function formatTime(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatMessage({ message, isNew = true }: ChatMessageProps) {
  const isUser = message.role === 'user'

  // User message style
  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        custom={isUser}
        variants={messageVariants}
        initial={isNew ? 'hidden' : false}
        animate="visible"
      >
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 bg-wine text-white shadow-sm">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </motion.div>
    )
  }

  // Assistant message style (WYN)
  return (
    <motion.div
      className="flex gap-3"
      custom={isUser}
      variants={messageVariants}
      initial={isNew ? 'hidden' : false}
      animate="visible"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-wine/20 flex items-center justify-center">
          <Wine className="h-4 w-4 text-wine" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-semibold text-sm">WYN</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </div>

        {/* Message */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {message.content}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1.5">
          {formatTime()}
        </p>
      </div>
    </motion.div>
  )
}
