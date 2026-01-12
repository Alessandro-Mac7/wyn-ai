'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputVariants } from '@/lib/motion'
import { CHAT_MAX_CHARACTERS } from '@/config/constants'
import { ScanButton } from '@/components/scan/ScanButton'

interface ChatInputProps {
  onSend: (message: string) => void
  onScan?: (imageDataUrl: string) => void
  onScanError?: (error: string) => void
  isLoading: boolean
  isScanLoading?: boolean
  placeholder: string
  hasError?: boolean
  autoFocus?: boolean
  showScanButton?: boolean
}

export function ChatInput({
  onSend,
  onScan,
  onScanError,
  isLoading,
  isScanLoading = false,
  placeholder,
  hasError = false,
  autoFocus = false,
  showScanButton = false,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = 'auto'
    // Set to scrollHeight (capped by max-h in className)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [input])

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

  const canSend = input.trim() && !isLoading && input.length <= CHAT_MAX_CHARACTERS
  const isNearLimit = input.length > CHAT_MAX_CHARACTERS * 0.8
  const isOverLimit = input.length > CHAT_MAX_CHARACTERS

  return (
    <div className="p-4 border-t border-border safe-bottom">
      <motion.div
        className={cn(
          'flex gap-2 items-end rounded-xl transition-colors',
          'glass',
          hasError && 'border-destructive'
        )}
        variants={inputVariants}
        animate={hasError ? 'error' : isFocused ? 'focused' : 'idle'}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          aria-label="Scrivi un messaggio"
          className={cn(
            'flex-1 resize-none bg-transparent rounded-xl px-4 py-3',
            'text-sm focus:outline-none disabled:opacity-50',
            'min-h-[48px] max-h-[120px]',
            'placeholder:text-muted-foreground'
          )}
        />
        <div className="flex items-center gap-1 mr-1 mb-1">
          {showScanButton && onScan && (
            <ScanButton
              onScan={onScan}
              onError={onScanError}
              disabled={isLoading}
              isLoading={isScanLoading}
            />
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Invia messaggio"
            className={cn(
              'shrink-0 p-3 rounded-lg',
              'transition-all duration-150',
              'btn-press',
              canSend
                ? 'bg-wine text-white hover:bg-wine-dark'
                : 'text-muted-foreground'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <p>Premi Invio per inviare, Shift+Invio per nuova riga</p>
        {input.length > 0 && (
          <span className={cn(
            'tabular-nums',
            isOverLimit && 'text-destructive font-medium',
            isNearLimit && !isOverLimit && 'text-amber-500'
          )}>
            {input.length}/{CHAT_MAX_CHARACTERS}
          </span>
        )}
      </div>
    </div>
  )
}
