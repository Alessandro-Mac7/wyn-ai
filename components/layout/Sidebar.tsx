'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, Mail, Plus, User, LogIn, LogOut, X, Shield, FileText, Cookie, Settings, History, ScanLine } from 'lucide-react'
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

// Navigation items (excluding New Conversation which is handled separately)
const navItems = [
  { icon: MessageCircle, label: 'Chat', href: '/chat', tooltip: 'Parla con il sommelier AI' },
  { icon: Sparkles, label: 'Scopri WYN', href: '/about', tooltip: 'Scopri le funzionalità di WYN' },
  { icon: Mail, label: 'Contatti', href: '/contacts', tooltip: 'Attiva WYN per il tuo ristorante' },
]

export function Sidebar({ onHomeClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const userContext = useUserOptional()
  const session = useSession()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showScanPanel, setShowScanPanel] = useState(false)

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

  // Get user initials for avatar
  const getInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Determine if on chat page
  const isOnChatPage = pathname === '/chat' || pathname.startsWith('/chat')

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHomeClick) {
      e.preventDefault()
      onHomeClick()
    }
  }

  const handleNewConversation = () => {
    router.push('/')
  }

  // Handle selecting a session from history
  const handleSelectHistorySession = (historySession: ChatSessionWithVenue) => {
    setCurrentSession(historySession.id)
    setShowHistoryPanel(false)

    // Build minimal venue object if available
    // The session context only needs essential venue data for display
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

    // Generate context message
    const contextMessage = generateContextMessage(historySession)

    // Load the session into context
    session.loadFromHistory({
      sessionId: historySession.id,
      venue,
      contextMessage,
    })

    // Navigate to chat
    router.push('/chat')
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
        {/* New Conversation Button - Always visible */}
        <Tooltip content="Nuova conversazione" side="right">
          <button
            onClick={handleNewConversation}
            className={cn(
              'flex flex-col items-center justify-center',
              'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
              'hover:bg-secondary btn-press',
              'text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight">Nuovo</span>
          </button>
        </Tooltip>

        {/* History Button - Opens history panel */}
        <Tooltip content="Storico chat" side="right">
          <button
            onClick={() => setShowHistoryPanel(true)}
            className={cn(
              'flex flex-col items-center justify-center',
              'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
              'hover:bg-secondary btn-press',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
              showHistoryPanel ? 'bg-secondary text-wine' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight">Storico</span>
          </button>
        </Tooltip>

        {/* Scan Button - Opens scan panel */}
        <Tooltip content="Scansiona etichetta" side="right">
          <button
            onClick={() => setShowScanPanel(true)}
            className={cn(
              'flex flex-col items-center justify-center',
              'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
              'hover:bg-secondary btn-press',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
              showScanPanel ? 'bg-secondary text-wine' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ScanLine className="h-5 w-5" />
            <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight">Scansiona</span>
          </button>
        </Tooltip>

        {navItems.map((item) => {
          const isActive = item.href === '/chat'
            ? isOnChatPage
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Tooltip key={item.href} content={item.tooltip} side="right">
              <Link
                href={item.href}

                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
                  'hover:bg-secondary btn-press',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
                )}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-secondary rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn('h-5 w-5 relative z-10', isActive && 'text-wine')} />
                <span className={cn(
                  'text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight',
                  isActive && 'text-wine'
                )}>
                  {item.label}
                </span>
              </Link>
            </Tooltip>
          )
        })}
      </nav>

      {/* User Menu Button */}
      <div className="mt-auto pb-3 flex flex-col items-center relative">
        <Tooltip content={isAuthenticated ? 'Account e impostazioni' : 'Menu'} side="right">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              'flex flex-col items-center justify-center',
              'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
              'hover:bg-secondary btn-press',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
              showUserMenu ? 'bg-secondary' : '',
              isAuthenticated ? 'text-wine' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isAuthenticated ? (
              <div className="w-7 h-7 rounded-full bg-wine/20 flex items-center justify-center text-sm font-medium text-wine">
                {getInitials()}
              </div>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight">Menu</span>
              </>
            )}
          </button>
        </Tooltip>

        {/* User Menu Dropdown */}
        <AnimatePresence>
          {showUserMenu && (
            <UserMenu
              isAuthenticated={isAuthenticated}
              displayName={displayName}
              email={email}
              onClose={() => setShowUserMenu(false)}
              onOpenProfile={() => {
                setShowUserMenu(false)
                setShowProfileModal(true)
              }}
              onOpenLogin={() => {
                setShowUserMenu(false)
                setShowLoginModal(true)
              }}
              onSignOut={async () => {
                setShowUserMenu(false)
                await userContext?.signOut()
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </aside>

    {/* Profile Modal */}
    <ProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
    />

    {/* Login Panel */}
    <LoginPanel
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
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
        setShowLoginModal(true)
      }}
    />
    </>
  )
}

// ============================================
// HISTORY PANEL COMPONENT
// ============================================

// Slide-in panel animation variants
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
  // Handle Escape key to close panel
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
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60"
            variants={historyBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Slide-in Panel from left (next to sidebar) */}
          <motion.div
            className={cn(
              'fixed inset-y-0 z-[70]',
              'left-0', // Slide from screen edge, behind sidebar visually
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
            {/* Header */}
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

            {/* Content */}
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

// ============================================
// USER MENU COMPONENT
// ============================================

interface UserMenuProps {
  isAuthenticated: boolean
  displayName?: string | null
  email?: string
  onClose: () => void
  onOpenProfile: () => void
  onOpenLogin: () => void
  onSignOut: () => void
}

function UserMenu({
  isAuthenticated,
  displayName,
  email,
  onClose,
  onOpenProfile,
  onOpenLogin,
  onSignOut,
}: UserMenuProps) {
  return (
    <>
      {/* Backdrop to close menu */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
      />

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, x: -10, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute left-full bottom-0 ml-2 w-56 z-50"
      >
        <div className="bg-card border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* User info header (if authenticated) */}
          {isAuthenticated && (
            <div className="px-4 py-3 border-b border-white/10">
              <p className="font-medium text-sm truncate">
                {displayName || 'Utente'}
              </p>
              {email && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {email}
                </p>
              )}
            </div>
          )}

          {/* Menu items */}
          <div className="py-1">
            {/* Login button (if not authenticated) */}
            {!isAuthenticated && (
              <button
                onClick={onOpenLogin}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-wine"
              >
                <LogIn className="w-4 h-4" />
                <span>Accedi</span>
              </button>
            )}

            {/* Profile button (if authenticated) */}
            {isAuthenticated && (
              <button
                onClick={onOpenProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Il mio profilo</span>
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-white/10 my-1" />

            {/* Legal links */}
            <Link
              href="/privacy"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Privacy Policy</span>
            </Link>

            <Link
              href="/cookie-policy"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Cookie className="w-4 h-4" />
              <span>Cookie Policy</span>
            </Link>

            <Link
              href="/terms"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Termini di Servizio</span>
            </Link>

            {/* Logout button (if authenticated) */}
            {isAuthenticated && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Esci</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
