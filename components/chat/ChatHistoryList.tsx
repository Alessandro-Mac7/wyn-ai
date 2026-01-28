'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { History, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSessionWithVenue } from '@/hooks/useChatHistory'
import { groupSessionsByDate } from '@/hooks/useChatHistory'
import { ChatHistoryItem } from './ChatHistoryItem'

// ============================================
// TYPES
// ============================================

interface ChatHistoryListProps {
  sessions: ChatSessionWithVenue[]
  currentSessionId?: string | null
  onSelectSession: (session: ChatSessionWithVenue) => void
  onDeleteSession: (sessionId: string) => Promise<boolean>
  isLoading: boolean
  isAuthenticated: boolean
  onLoginClick?: () => void
}

// ============================================
// SKELETON COMPONENT
// ============================================

function HistorySkeleton() {
  return (
    <div className="space-y-2 px-2">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="h-12 rounded-lg bg-white/5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}

// ============================================
// EMPTY STATE COMPONENTS
// ============================================

function EmptyState() {
  return (
    <div className="px-3 py-4 text-center">
      <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
      <p className="text-xs text-muted-foreground">
        Nessuna conversazione salvata
      </p>
    </div>
  )
}

interface LoginPromptProps {
  onLoginClick?: () => void
}

function LoginPrompt({ onLoginClick }: LoginPromptProps) {
  return (
    <div className="px-3 py-4 text-center">
      <LogIn className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
      <p className="text-xs text-muted-foreground mb-2">
        Accedi per vedere lo storico
      </p>
      {onLoginClick && (
        <button
          onClick={onLoginClick}
          className="text-xs text-wine hover:underline"
        >
          Accedi
        </button>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ChatHistoryList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isLoading,
  isAuthenticated,
  onLoginClick,
}: ChatHistoryListProps) {
  // Group sessions by date
  const groupedSessions = groupSessionsByDate(sessions)

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return <LoginPrompt onLoginClick={onLoginClick} />
  }

  // Loading state
  if (isLoading) {
    return <HistorySkeleton />
  }

  // Empty state
  if (sessions.length === 0) {
    return <EmptyState />
  }

  // Render grouped sessions
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {groupedSessions.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.05 }}
          >
            {/* Group label */}
            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>

            {/* Sessions in group */}
            <div className="space-y-1 px-1">
              <AnimatePresence mode="popLayout">
                {group.sessions.map((session, sessionIndex) => (
                  <ChatHistoryItem
                    key={session.id}
                    session={session}
                    isActive={currentSessionId === session.id}
                    onClick={() => onSelectSession(session)}
                    onDelete={() => onDeleteSession(session.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
