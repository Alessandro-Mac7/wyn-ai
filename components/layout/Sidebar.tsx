'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, User, LogIn, LogOut, X, Shield, FileText, Cookie, History, ScanLine, MessageCircle, MoreHorizontal, Sparkles, Mail } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useUserOptional } from '@/contexts/user-context'
import { useSession } from '@/contexts/session-context'
import { ProfileModal } from '@/components/auth/ProfileModal'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { ChatHistoryList } from '@/components/chat/ChatHistoryList'
import { ScanPanel } from '@/components/scan/ScanPanel'
import { useChatHistory, generateContextMessage, type ChatSessionWithVenue } from '@/hooks/useChatHistory'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onHomeClick?: () => void
}

export function Sidebar({ onHomeClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const userContext = useUserOptional()
  const session = useSession()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLoginPanel, setShowLoginPanel] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showScanPanel, setShowScanPanel] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Chat history hook
  const {
    sessions,
    isLoading: isHistoryLoading,
    deleteSession,
    currentSessionId,
    setCurrentSession,
  } = useChatHistory()

  const isAuthenticated = userContext?.isAuthenticated ?? false
  const displayName = userContext?.profile?.display_name
  const email = userContext?.user?.email

  const getInitials = () => {
    if (displayName) return displayName.charAt(0).toUpperCase()
    if (email) return email.charAt(0).toUpperCase()
    return 'U'
  }

  const isOnChatPage = pathname === '/chat' || pathname.startsWith('/chat')
  const isAbout = pathname === '/about'
  const isContacts = pathname === '/contacts'
  const isMoreActive = isAbout || isContacts

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHomeClick) {
      e.preventDefault()
      onHomeClick()
    }
  }

  const handleNewConversation = () => {
    router.push('/')
  }

  const handleSelectHistorySession = (historySession: ChatSessionWithVenue) => {
    setCurrentSession(historySession.id)
    setShowHistoryPanel(false)

    const venue = historySession.venue
      ? {
          id: historySession.venue.id,
          name: historySession.venue.name,
          slug: historySession.venue.slug,
          description: null,
          email: null,
          latitude: null,
          longitude: null,
          address: null,
          city: null,
          created_at: historySession.created_at,
          updated_at: historySession.updated_at,
        }
      : null

    const contextMessage = generateContextMessage(historySession)

    session.loadFromHistory({
      sessionId: historySession.id,
      venue,
      contextMessage,
    })

    router.push('/chat')
  }

  const handleProfileOrLogin = () => {
    if (isAuthenticated) {
      setShowProfileModal(true)
    } else {
      setShowLoginPanel(true)
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 hidden sm:flex flex-col bg-card shadow-[4px_0_12px_rgba(0,0,0,0.2)]">
        {/* Logo - Home button */}
        <div className="flex items-center justify-center pt-5 pb-3">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="focus-visible:outline-none"
          >
            <motion.div
              className="origin-bottom"
              whileHover={{
                skewX: -8,
                filter: 'drop-shadow(0 0 8px rgba(143, 36, 54, 0.6))'
              }}
              whileTap={{
                skewX: -12,
                filter: 'drop-shadow(0 0 12px rgba(143, 36, 54, 0.8))'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Image
                src="/wyn-icon.ico"
                alt="WYN"
                width={44}
                height={44}
                className="w-11 h-11"
              />
            </motion.div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-2">
          {/* New Conversation */}
          <Tooltip content="Nuova conversazione" side="right">
            <button
              onClick={handleNewConversation}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-[52px] h-[52px] rounded-lg transition-colors relative',
                'hover:bg-secondary btn-press',
                'text-muted-foreground hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
              )}
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] mt-1 relative z-10 text-center leading-tight">Nuovo</span>
            </button>
          </Tooltip>

          {/* Chat */}
          <Tooltip content="Parla con il sommelier AI" side="right">
            <Link
              href="/chat"
              className={cn(
                'flex flex-col items-center justify-center',
                'w-[52px] h-[52px] rounded-lg transition-colors relative',
                'hover:bg-secondary btn-press',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
              )}
            >
              {isOnChatPage && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-secondary rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <MessageCircle className={cn('h-5 w-5 relative z-10', isOnChatPage && 'text-wine')} />
              <span className={cn('text-[11px] mt-1 relative z-10 text-center leading-tight', isOnChatPage ? 'text-wine' : 'text-muted-foreground')}>Chat</span>
            </Link>
          </Tooltip>

          {/* Storico */}
          <Tooltip content="Storico chat" side="right">
            <button
              onClick={() => setShowHistoryPanel(true)}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-[52px] h-[52px] rounded-lg transition-colors relative',
                'hover:bg-secondary btn-press',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                showHistoryPanel ? 'bg-secondary text-wine' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <History className="h-5 w-5" />
              <span className="text-[11px] mt-1 relative z-10 text-center leading-tight">Storico</span>
            </button>
          </Tooltip>

          {/* Scan */}
          <Tooltip content="Scansiona etichetta" side="right">
            <button
              onClick={() => setShowScanPanel(true)}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-[52px] h-[52px] rounded-lg transition-colors relative',
                'hover:bg-secondary btn-press',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                showScanPanel ? 'bg-secondary text-wine' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ScanLine className="h-5 w-5" />
              <span className="text-[11px] mt-1 relative z-10 text-center leading-tight">Scansiona</span>
            </button>
          </Tooltip>

          {/* Altro — popover with Scopri + Contatti */}
          <div className="relative">
            <Tooltip content="Scopri WYN, Contatti" side="right">
              <button
                onClick={() => setShowMoreMenu(v => !v)}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-[52px] h-[52px] rounded-lg transition-colors relative',
                  'hover:bg-secondary btn-press',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                  isMoreActive || showMoreMenu ? 'bg-secondary text-wine' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[11px] mt-1 relative z-10 text-center leading-tight">Altro</span>
              </button>
            </Tooltip>

            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <motion.div
                    className="absolute left-full top-0 ml-2 w-48 z-50 rounded-xl overflow-hidden glass-ios"
                    initial={{ opacity: 0, x: -8, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href="/about"
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                        isAbout ? 'text-wine' : 'text-foreground hover:bg-white/5'
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      Scopri WYN
                    </Link>
                    <div className="h-px bg-white/10" />
                    <Link
                      href="/contacts"
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                        isContacts ? 'text-wine' : 'text-foreground hover:bg-white/5'
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      Contatti
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Bottom: Accedi / Profilo */}
        <div className="mt-auto pb-3 flex flex-col items-center gap-1 relative">
          {/* User menu (legal + logout) — only for authenticated */}
          {isAuthenticated && (
            <div className="relative">
              <Tooltip content="Account" side="right">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'w-[52px] h-[52px] rounded-lg transition-colors relative',
                    'hover:bg-secondary btn-press',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                    'text-wine'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-wine/20 flex items-center justify-center text-sm font-medium text-wine">
                    {getInitials()}
                  </div>
                </button>
              </Tooltip>
            </div>
          )}

          {!isAuthenticated && (
            <Tooltip content="Accedi a WYN" side="right">
              <button
                onClick={handleProfileOrLogin}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-[52px] h-[52px] rounded-lg transition-colors relative',
                  'hover:bg-secondary btn-press',
                  'text-muted-foreground hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
                )}
              >
                <LogIn className="h-5 w-5" />
                <span className="text-[11px] mt-1 relative z-10 text-center leading-tight">Accedi</span>
              </button>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Login Panel */}
      <LoginPanel
        isOpen={showLoginPanel}
        onClose={() => setShowLoginPanel(false)}
      />

      {/* Scan Panel */}
      <ScanPanel
        isOpen={showScanPanel}
        onClose={() => setShowScanPanel(false)}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        sessions={sessions}
        isLoading={isHistoryLoading}
        isAuthenticated={isAuthenticated}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectHistorySession}
        onDeleteSession={deleteSession}
        onOpenLogin={() => {
          setShowHistoryPanel(false)
          setShowLoginPanel(true)
        }}
      />
    </>
  )
}

// ============================================
// HISTORY PANEL COMPONENT
// ============================================

const historyBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 }
  }
} as const

const historyPanelVariants = {
  hidden: {
    x: '-100%',
  },
  visible: {
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 32,
      mass: 0.8,
    }
  },
  exit: {
    x: '-100%',
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 32,
      mass: 0.8,
    }
  }
} as const

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  sessions: ChatSessionWithVenue[]
  isLoading: boolean
  isAuthenticated: boolean
  currentSessionId: string | null
  onSelectSession: (session: ChatSessionWithVenue) => void
  onDeleteSession: (id: string) => Promise<boolean>
  onOpenLogin: () => void
}

function HistoryPanel({
  isOpen,
  onClose,
  sessions,
  isLoading,
  isAuthenticated,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onOpenLogin,
}: HistoryPanelProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60"
            variants={historyBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            className={cn(
              'fixed inset-y-0 z-[70]',
              'left-0',
              'w-72 sm:w-80 max-w-[calc(100vw-3.5rem)]',
              'bg-card border-r border-border',
              'flex flex-col',
              'shadow-[8px_0_32px_rgba(0,0,0,0.3)]'
            )}
            variants={historyPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-panel-title"
          >
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <History className="h-4 w-4 text-wine" />
                </div>
                <h2 id="history-panel-title" className="text-base font-semibold">
                  Storico Chat
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <ChatHistoryList
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={onDeleteSession}
                isLoading={isLoading}
                isAuthenticated={isAuthenticated}
                onLoginClick={onOpenLogin}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
