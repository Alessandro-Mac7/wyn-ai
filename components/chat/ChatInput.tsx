'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputVariants } from '@/lib/motion'
import { CHAT_MAX_CHARACTERS } from '@/config/constants'
import { ImageAttachment } from './ImageAttachment'

interface ChatInputProps {
  onSend: (message: string) => void
  onImageScan?: (imageDataUrl: string) => void
  isLoading: boolean
  isScanLoading?: boolean
  placeholder: string
  hasError?: boolean
  autoFocus?: boolean
  showImageAttachment?: boolean
  attachedImage?: string | null
  onImageAttach?: (imageDataUrl: string) => void
  onImageClear?: () => void
}

export function ChatInput({
  onSend,
  onImageScan,
  isLoading,
  isScanLoading = false,
  placeholder,
  hasError = false,
  autoFocus = false,
  showImageAttachment = true,
  attachedImage = null,
  onImageAttach,
  onImageClear,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [localImage, setLocalImage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use attached image from parent or local state
  const imagePreview = attachedImage ?? localImage

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
    // Can send if there's text OR an attached image
    const canSendMessage = (input.trim() || imagePreview) && !isLoading && input.length <= CHAT_MAX_CHARACTERS

    if (!canSendMessage) return

    // If there's an image, trigger scan
    if (imagePreview && onImageScan) {
      onImageScan(imagePreview)
      // Clear the image after sending
      handleImageClear()
    }

    // If there's text, send it
    if (input.trim()) {
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

  const handleImageSelect = (imageDataUrl: string) => {
    if (onImageAttach) {
      onImageAttach(imageDataUrl)
    } else {
      setLocalImage(imageDataUrl)
    }
  }

  const handleImageClear = () => {
    if (onImageClear) {
      onImageClear()
    } else {
      setLocalImage(null)
    }
  }

  // Can send if there's text OR an image attached
  const canSend = (input.trim() || imagePreview) && !isLoading && input.length <= CHAT_MAX_CHARACTERS
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
          placeholder={imagePreview ? 'Aggiungi un messaggio (opzionale)...' : placeholder}
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
          {showImageAttachment && (
            <ImageAttachment
              onImageSelect={handleImageSelect}
              onImageClear={handleImageClear}
              imagePreview={imagePreview}
              isLoading={isScanLoading}
              disabled={isLoading}
            />
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label={imagePreview ? 'Analizza immagine' : 'Invia messaggio'}
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
        <p>
          {imagePreview
            ? 'Premi Invio per analizzare l\'etichetta'
            : 'Premi Invio per inviare, Shift+Invio per nuova riga'}
        </p>
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
