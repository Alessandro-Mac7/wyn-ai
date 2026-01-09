'use client'

import { useState, useRef, KeyboardEvent, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, MapPin, ChevronRight } from 'lucide-react'
// Session context not needed - we pass query via URL params
import { useVenue, useRecentVenues } from '@/hooks/useVenue'
import {
  QuickSuggestions,
  VenueSelector,
} from '@/components/chat'
import { GENERAL_SUGGESTIONS } from '@/lib/prompts'
import { cn } from '@/lib/utils'
import { inputVariants } from '@/lib/motion'

export default function HomePage() {
  const router = useRouter()
  const { loadVenue } = useVenue()
  const { recentVenues } = useRecentVenues()

  // UI state
  const [showVenueSelector, setShowVenueSelector] = useState(false)
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle venue selection - load venue to session then navigate
  const handleVenueSelect = useCallback(async (slug: string) => {
    setShowVenueSelector(false)
    // Load venue into session
    await loadVenue(slug)
    // Navigate to chat
    router.push('/chat')
  }, [loadVenue, router])

  // Handle send - navigate to chat with query param
  const handleSend = useCallback(() => {
    if (input.trim()) {
      // Navigate to chat page with query param (chat page will send the message)
      router.push(`/chat?q=${encodeURIComponent(input.trim())}`)
    }
  }, [input, router])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle quick suggestion - navigate to chat with query param
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    router.push(`/chat?q=${encodeURIComponent(suggestion)}`)
  }, [router])

  const canSend = input.trim().length > 0

  return (
    <div className="min-h-screen">
      {/* Main content */}
      <main id="main-content" className="pl-0 sm:pl-16 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          {/* Logo and Tagline */}
          <motion.div
            className="flex items-center justify-center mb-2"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [1, 1.02, 1],
              rotate: [0, -0.5, 0.5, 0],
              filter: [
                'drop-shadow(0 0 8px rgba(143, 36, 54, 0.3))',
                'drop-shadow(0 0 16px rgba(143, 36, 54, 0.5))',
                'drop-shadow(0 0 8px rgba(143, 36, 54, 0.3))'
              ]
            }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              scale: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              },
              filter: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            }}
          >
            <Image
              src="/wyn-logo.png"
              alt="WYN - Il tuo sommelier AI"
              width={400}
              height={160}
              className="h-40 sm:h-48 w-auto"
              priority
            />
          </motion.div>
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-wine to-wine-dark">
              Drink Smart.
            </p>
            <p className="text-lg sm:text-xl text-foreground mt-1">
              Il vino giusto, al momento giusto.
            </p>
          </motion.div>

          {/* PRIMARY CTA - Venue selection */}
          <motion.div
            className="w-full max-w-md mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <motion.button
              onClick={() => setShowVenueSelector(true)}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-6 py-4',
                'text-base font-medium rounded-xl',
                'bg-wine text-white',
                'shadow-[0_4px_20px_rgba(143,36,54,0.4)]',
                'hover:bg-wine-dark hover:shadow-[0_4px_24px_rgba(143,36,54,0.5)]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin className="h-5 w-5" />
              Sei in un ristorante? Inizia qui
              <ChevronRight className="h-5 w-5" />
            </motion.button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Accedi alla carta dei vini del locale
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="flex items-center gap-4 w-full max-w-md mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">oppure chat generale</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* SECONDARY - General chat input (iOS glass style) */}
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <motion.div
              className={cn(
                'relative flex items-end gap-2 rounded-2xl',
                'bg-card/80 backdrop-blur-xl',
                'border border-white/10',
                'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset]'
              )}
              variants={inputVariants}
              animate={isFocused ? 'focused' : 'idle'}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Chiedimi qualsiasi cosa sul vino..."
                rows={1}
                aria-label="Scrivi un messaggio"
                className={cn(
                  'flex-1 resize-none bg-transparent rounded-2xl px-4 py-3 pr-14',
                  'text-sm focus:outline-none',
                  'min-h-[48px] max-h-[120px]',
                  'placeholder:text-muted-foreground/70'
                )}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Invia messaggio"
                className={cn(
                  'absolute right-2 bottom-[6px] p-2.5 rounded-full',
                  'transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                  canSend
                    ? 'bg-wine text-white hover:bg-wine-dark cursor-pointer btn-press'
                    : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </motion.div>
            <p className="hidden sm:block text-xs text-muted-foreground text-center mt-2">
              Premi Invio per inviare
            </p>
          </motion.div>

          {/* Quick Suggestions */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <QuickSuggestions
              suggestions={GENERAL_SUGGESTIONS}
              onSelect={handleSuggestionSelect}
            />
          </motion.div>
        </div>
      </main>

      {/* Venue Selector Modal */}
      <VenueSelector
        isOpen={showVenueSelector}
        onClose={() => setShowVenueSelector(false)}
        onSelect={handleVenueSelect}
        recentVenues={recentVenues}
      />
    </div>
  )
}
