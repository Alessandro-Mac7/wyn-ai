'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Wine, Sparkles, QrCode, MapPin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { messageVariants } from '@/lib/motion'
import type { ChatMessage as MessageType } from '@/types'

interface ChatMessageProps {
  message: MessageType
  isNew?: boolean
  showCta?: boolean
  ctaVariant?: 'scan-qr' | 'discover-venues'
  onCtaAction?: (action: 'scan-qr' | 'discover-venues') => void
}

// Format timestamp
function formatTime(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Contextual CTA component
interface ContextualCtaProps {
  variant: 'scan-qr' | 'discover-venues'
  onAction: (action: 'scan-qr' | 'discover-venues') => void
}

function ContextualCta({ variant, onAction }: ContextualCtaProps) {
  const config = {
    'scan-qr': {
      icon: QrCode,
      text: 'Sei al ristorante? Scannerizza il QR',
    },
    'discover-venues': {
      icon: MapPin,
      text: 'Scopri ristoranti WYN vicino a te',
    },
  }

  const { icon: Icon, text } = config[variant]

  return (
    <motion.button
      className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-wine transition-colors px-3 py-1.5 rounded-lg bg-wine/5 border border-wine/10 hover:bg-wine/10 hover:border-wine/20"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      onClick={() => onAction(variant)}
      type="button"
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{text}</span>
    </motion.button>
  )
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  function ChatMessage({ message, isNew = true, showCta = false, ctaVariant, onCtaAction }, ref) {
    const isUser = message.role === 'user'

    // User message style
    if (isUser) {
      return (
        <motion.div
          ref={ref}
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
        ref={ref}
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
          <div className="text-sm leading-relaxed text-foreground prose prose-sm prose-invert max-w-none prose-p:my-1 prose-strong:text-wine prose-strong:font-semibold">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1.5">
            {formatTime()}
          </p>

          {/* CTA - after timestamp */}
          {showCta && ctaVariant && onCtaAction && (
            <ContextualCta variant={ctaVariant} onAction={onCtaAction} />
          )}
        </div>
      </motion.div>
    )
  }
)
