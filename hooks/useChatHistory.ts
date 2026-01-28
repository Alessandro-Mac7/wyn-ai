'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ChatSession } from '@/types/user'
import type { Venue } from '@/types'
import { useUserOptional } from '@/contexts/user-context'

// ============================================
// TYPES
// ============================================

export interface ChatSessionWithVenue extends ChatSession {
  venue?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface UseChatHistoryReturn {
  sessions: ChatSessionWithVenue[]
  isLoading: boolean
  error: string | null
  fetchSessions: () => Promise<void>
  deleteSession: (id: string) => Promise<boolean>
  currentSessionId: string | null
  setCurrentSession: (id: string | null) => void
}

// ============================================
// HOOK
// ============================================

export function useChatHistory(): UseChatHistoryReturn {
  const userContext = useUserOptional()
  const isAuthenticated = userContext?.isAuthenticated ?? false

  const [sessions, setSessions] = useState<ChatSessionWithVenue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat-session?limit=10')

      if (!response.ok) {
        if (response.status === 401) {
          setSessions([])
          return
        }
        throw new Error('Errore nel recupero delle sessioni')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Delete a session
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chat-session?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore nella cancellazione')
      }

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== id))

      // Clear current session if it was deleted
      if (currentSessionId === id) {
        setCurrentSessionId(null)
      }

      return true
    } catch (err) {
      console.error('Failed to delete session:', err)
      return false
    }
  }, [currentSessionId])

  // Set current session
  const setCurrentSession = useCallback((id: string | null) => {
    setCurrentSessionId(id)
  }, [])

  // Fetch sessions when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions()
    } else {
      setSessions([])
      setCurrentSessionId(null)
    }
  }, [isAuthenticated, fetchSessions])

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    deleteSession,
    currentSessionId,
    setCurrentSession,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format relative time for session display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'ora'
  if (diffMins < 60) return `${diffMins} min fa`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`
  if (diffDays === 1) return 'ieri'
  if (diffDays < 7) return `${diffDays} giorni fa`

  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

/**
 * Group sessions by date for display
 */
export function groupSessionsByDate(sessions: ChatSessionWithVenue[]): {
  label: string
  sessions: ChatSessionWithVenue[]
}[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; sessions: ChatSessionWithVenue[] }[] = [
    { label: 'Oggi', sessions: [] },
    { label: 'Ieri', sessions: [] },
    { label: 'Questa settimana', sessions: [] },
    { label: 'Più vecchie', sessions: [] },
  ]

  sessions.forEach(session => {
    const sessionDate = new Date(session.created_at)
    const sessionDay = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate()
    )

    if (sessionDay.getTime() >= today.getTime()) {
      groups[0].sessions.push(session)
    } else if (sessionDay.getTime() >= yesterday.getTime()) {
      groups[1].sessions.push(session)
    } else if (sessionDay.getTime() >= weekAgo.getTime()) {
      groups[2].sessions.push(session)
    } else {
      groups[3].sessions.push(session)
    }
  })

  // Filter out empty groups
  return groups.filter(g => g.sessions.length > 0)
}

/**
 * Generate a context message for resuming a session
 */
export function generateContextMessage(session: ChatSessionWithVenue): string {
  const parts: string[] = []

  // Add topic if available
  if (session.summary?.topic) {
    parts.push(`Continuiamo la conversazione su "${session.summary.topic}"`)
  }

  // Add venue context if available
  if (session.venue?.name) {
    parts.push(`presso ${session.venue.name}`)
  }

  // Add wine context if available
  if (session.summary?.wines_discussed && session.summary.wines_discussed.length > 0) {
    const wines = session.summary.wines_discussed.slice(0, 3).join(', ')
    parts.push(`Parlavamo di ${wines}`)
  }

  if (parts.length === 0) {
    return 'Riprendiamo la nostra conversazione...'
  }

  return parts.join('. ') + '.'
}
