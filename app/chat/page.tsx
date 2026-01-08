'use client'

import { useState, useRef, useEffect, KeyboardEvent, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, CheckCircle, Loader2 } from 'lucide-react'
import { useSession } from '@/contexts/session-context'
import { useChat } from '@/hooks/useChat'
import { useVenue, useRecentVenues } from '@/hooks/useVenue'
import {
  ChatMessages,
  VenueHeader,
  VenueSelectionBar,
  VenueSelector,
} from '@/components/chat'
import { Sidebar } from '@/components/layout'
import { cn } from '@/lib/utils'
import { inputVariants } from '@/lib/motion'
import type { ChatMessage } from '@/types'

// Initial AI welcome message for general chat
const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Buonasera! Sono WYN, il tuo sommelier AI. Sono qui per aiutarti a scoprire il vino perfetto per la tua serata. Cosa ti va stasera?',
}

// Initial AI welcome message for venue chat (dynamic)
function getVenueWelcomeMessage(venueName: string): ChatMessage {
  return {
    role: 'assistant',
    content: `Benvenuto da ${venueName}! Sono WYN, il tuo sommelier AI. Conosco la carta dei vini e sono pronto a consigliarti. Cosa ti piacerebbe stasera?`,
  }
}

// Wrapper component to handle Suspense boundary for useSearchParams
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  )
}

// Loading fallback for Suspense
function ChatPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Image
          src="/wyn-icon.ico"
          alt="WYN"
          width={48}
          height={48}
          className="w-12 h-12 animate-toast mx-auto"
          priority
        />
        <p className="mt-4 text-sm text-muted-foreground">Caricamento...</p>
      </div>
    </div>
  )
}

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Session state (persisted)
  const { mode, venueData, filters, setFilters, clearConversation } = useSession()

  // Chat and venue hooks
  const { messages, isLoading, error, sendMessage } = useChat()
  const { venue, wineStats, loadVenue, clearVenue, isLoading: venueLoading, error: venueError } = useVenue()
  const { recentVenues, addRecentVenue } = useRecentVenues()

  // UI state
  const [showVenueSelector, setShowVenueSelector] = useState(false)
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showInputHint, setShowInputHint] = useState(false)
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [venueErrorDismissed, setVenueErrorDismissed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const legacyMigrationDone = useRef(false)
  const hasShownHint = useRef(false)

  // Handle URL params (query from home page or legacy)
  useEffect(() => {
    if (legacyMigrationDone.current) return

    const venueParam = searchParams.get('venue')
    const queryParam = searchParams.get('q')

    if (venueParam || queryParam) {
      legacyMigrationDone.current = true

      // Load venue if specified
      if (venueParam && !venueData) {
        loadVenue(venueParam)
      }

      // Send query message (this triggers API call with loading state)
      if (queryParam) {
        sendMessage(queryParam)
      }

      // Clear params from URL
      router.replace('/chat', { scroll: false })
    }
  }, [searchParams, venueData, loadVenue, sendMessage, router])

  // When venue loads, add to recent venues
  useEffect(() => {
    if (venue) {
      addRecentVenue(venue)
    }
  }, [venue, addRecentVenue])

  // Reset error dismissed when error changes
  useEffect(() => {
    if (error) {
      setErrorDismissed(false)
    }
  }, [error])

  // Reset venue error dismissed when venue error changes
  useEffect(() => {
    if (venueError) {
      setVenueErrorDismissed(false)
    }
  }, [venueError])

  // Handle input focus - show hint only on first focus
  const handleInputFocus = useCallback(() => {
    setIsFocused(true)
    if (!hasShownHint.current) {
      setShowInputHint(true)
      hasShownHint.current = true
      // Auto-hide hint after 3 seconds
      setTimeout(() => setShowInputHint(false), 3000)
    }
  }, [])

  // Determine if we're in venue mode
  const isVenueMode = mode === 'venue'

  // Handle venue selection from the bar
  const handleOpenVenueSelector = useCallback(() => {
    setShowVenueSelector(true)
  }, [])

  // Handle venue selection
  const handleVenueSelect = useCallback(async (slug: string) => {
    setShowVenueSelector(false)
    await loadVenue(slug)
  }, [loadVenue])

  // Close venue mode - clears venue and starts fresh conversation
  const handleCloseVenue = useCallback(() => {
    clearVenue()
    clearConversation()
  }, [clearVenue, clearConversation])

  // Navigate to home
  const handleHomeClick = useCallback(() => {
    router.push('/')
  }, [router])

  // Handle send message
  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim() && !isLoading
  const placeholder = venue
    ? `Chiedi della carta dei vini di ${venue.name}...`
    : 'Chiedimi del vino, abbinamenti, regioni...'

  // Show initial message for both chat modes when no messages
  const displayMessages = messages.length > 0
    ? messages
    : isVenueMode && venue
      ? [getVenueWelcomeMessage(venue.name)]
      : [INITIAL_MESSAGE]

  return (
    <div className="min-h-screen">
      {/* Sidebar - simplified, single Chat button */}
      <Sidebar onHomeClick={handleHomeClick} />

      {/* Main content */}
      <main id="main-content" className="pl-14 sm:pl-16 min-h-screen flex flex-col">
        {/* Top bar: VenueSelectionBar (general mode) or VenueHeader (venue mode) */}
        <AnimatePresence mode="wait">
          {venue ? (
            <VenueHeader
              key="venue-header"
              venue={venue}
              wineStats={wineStats || undefined}
              selectedTypes={filters.wineTypes}
              onFilterChange={(types) => setFilters({ wineTypes: types })}
              onClose={handleCloseVenue}
            />
          ) : !venueLoading && (
            <VenueSelectionBar
              key="venue-selection"
              onSelectVenue={handleOpenVenueSelector}
            />
          )}
        </AnimatePresence>

        {/* Venue Error Display - when venue code is invalid */}
        <AnimatePresence>
          {venueError && !venueErrorDismissed && !venueLoading && (
            <motion.div
              className="px-4 pt-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="max-w-3xl mx-auto">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Image
                      src="/wyn-icon.ico"
                      alt="WYN"
                      width={24}
                      height={24}
                      className="w-6 h-6 opacity-70"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-200">Locale non trovato</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Il codice del locale non è valido o il locale non esiste più.
                      Puoi continuare in modalità generale o cercare un altro locale.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => {
                          setVenueErrorDismissed(true)
                          setShowVenueSelector(true)
                        }}
                        className="text-sm font-medium text-wine hover:text-wine-light transition-colors"
                      >
                        Cerca locale
                      </button>
                      <button
                        onClick={() => setVenueErrorDismissed(true)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Continua in generale
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setVenueErrorDismissed(true)}
                    className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    aria-label="Chiudi avviso"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state for venue - enhanced with toast animation */}
        <AnimatePresence>
          {venueLoading && (
            <motion.div
              className="flex-1 flex flex-col items-center justify-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <Image
                  src="/wyn-icon.ico"
                  alt="WYN"
                  width={48}
                  height={48}
                  className="w-12 h-12 animate-toast"
                  priority
                />
              </div>
              <div className="text-center max-w-xs">
                <h3 className="text-lg font-semibold">Caricamento in corso...</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Stiamo preparando la carta dei vini
                </p>

                {/* Progress steps */}
                <div className="mt-5 space-y-2 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-wine/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-wine" />
                    </div>
                    <span className="text-sm text-muted-foreground">Connessione al database</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-wine/30 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-wine animate-spin" />
                    </div>
                    <span className="text-sm">Caricamento vini...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area (hidden during loading) */}
        {!venueLoading && (
          <div className="flex-1 flex flex-col">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
              <div className="max-w-3xl mx-auto">
                <ChatMessages messages={displayMessages} isLoading={isLoading} />
              </div>
            </div>

            {/* Error display - with dismiss button */}
            <AnimatePresence>
              {error && !errorDismissed && (
                <div className="px-4">
                  <motion.div
                    className="max-w-3xl mx-auto w-full p-3 rounded-lg mb-3 flex items-start gap-3 bg-destructive/10 border border-destructive/30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-red-300">{error}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Riprova o contatta il supporto se il problema persiste.
                      </p>
                    </div>
                    <button
                      onClick={() => setErrorDismissed(true)}
                      className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      aria-label="Chiudi errore"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Floating Input at bottom */}
            <div className="px-4 pb-6">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  {/* Input hint tooltip */}
                  <AnimatePresence>
                    {showInputHint && (
                      <motion.div
                        className="absolute -top-10 left-4 text-xs text-muted-foreground bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-lg z-10"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                      >
                        Shift+Invio per nuova riga
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    className={cn(
                      'relative flex items-end gap-2 rounded-xl w-full',
                      'bg-card/90 backdrop-blur-md',
                      'shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
                      error && !errorDismissed && 'ring-1 ring-destructive'
                    )}
                    variants={inputVariants}
                    animate={error && !errorDismissed ? 'error' : isFocused ? 'focused' : 'idle'}
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={handleInputFocus}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      disabled={isLoading}
                      rows={1}
                      aria-label="Scrivi un messaggio"
                      className={cn(
                        'flex-1 resize-none bg-transparent rounded-xl px-4 py-3 pr-14',
                        'text-sm focus:outline-none disabled:opacity-50',
                        'min-h-[48px] max-h-[120px]',
                        'placeholder:text-muted-foreground'
                      )}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      aria-label="Invia messaggio"
                      className={cn(
                        'absolute right-2 bottom-2 p-2.5 rounded-lg',
                        'transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                        canSend
                          ? 'bg-wine text-white hover:bg-wine-dark cursor-pointer btn-press'
                          : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Premi Invio per inviare
                </p>
              </div>
            </div>
          </div>
        )}
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
