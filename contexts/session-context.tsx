'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { ChatMessage, Venue } from '@/types'
import type {
  SessionState,
  SessionContextType,
  ChatMode,
  SessionFilters,
} from '@/types/session'
import { createInitialSessionState } from '@/types/session'
import {
  SESSION_STORAGE_KEY,
  SESSION_VERSION,
  SESSION_MAX_AGE_MS,
  MAX_PERSISTED_MESSAGES,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '@/lib/session-storage'

// Action types
type SessionAction =
  | { type: 'SET_MODE'; payload: ChatMode }
  | { type: 'SET_VENUE'; payload: Venue | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'SET_FILTERS'; payload: SessionFilters }
  | { type: 'RESET_SESSION' }
  | { type: 'HYDRATE'; payload: SessionState }

// Reducer
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  const now = Date.now()

  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        lastActivityAt: now,
      }

    case 'SET_VENUE':
      return {
        ...state,
        venueSlug: action.payload?.slug ?? null,
        venueData: action.payload,
        mode: action.payload ? 'venue' : 'general',
        // Clear filters when venue changes
        filters: action.payload ? state.filters : { wineTypes: [] },
        lastActivityAt: now,
      }

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload].slice(-MAX_PERSISTED_MESSAGES),
        conversationStartedAt: state.conversationStartedAt ?? now,
        lastActivityAt: now,
      }

    case 'CLEAR_CONVERSATION':
      return {
        ...state,
        messages: [],
        conversationStartedAt: null,
        lastActivityAt: now,
      }

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
        lastActivityAt: now,
      }

    case 'RESET_SESSION':
      return {
        ...createInitialSessionState(),
        lastActivityAt: now,
      }

    case 'HYDRATE':
      return action.payload

    default:
      return state
  }
}

// Create context
const SessionContext = createContext<SessionContextType | null>(null)

// Provider props
interface SessionProviderProps {
  children: ReactNode
}

// Provider component
export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, createInitialSessionState())

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStorageItem(SESSION_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionState

        // Check if session is stale
        const isStale = Date.now() - parsed.lastActivityAt > SESSION_MAX_AGE_MS

        // Check version compatibility
        const isCompatible = parsed.version === SESSION_VERSION

        if (!isStale && isCompatible) {
          dispatch({ type: 'HYDRATE', payload: parsed })
        } else {
          // Clear stale or incompatible session
          removeStorageItem(SESSION_STORAGE_KEY)
        }
      } catch {
        // Invalid JSON, clear storage
        removeStorageItem(SESSION_STORAGE_KEY)
      }
    }
  }, [])

  // Persist to localStorage on state changes
  useEffect(() => {
    // Don't persist initial state before hydration
    if (state.lastActivityAt === 0) return

    try {
      setStorageItem(SESSION_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }, [state])

  // Actions
  const setMode = useCallback((mode: ChatMode) => {
    dispatch({ type: 'SET_MODE', payload: mode })
  }, [])

  const setVenue = useCallback((venue: Venue | null) => {
    dispatch({ type: 'SET_VENUE', payload: venue })
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message })
  }, [])

  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERSATION' })
  }, [])

  const setFilters = useCallback((filters: SessionFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' })
    removeStorageItem(SESSION_STORAGE_KEY)
  }, [])

  const isSessionStale = useCallback(() => {
    return Date.now() - state.lastActivityAt > SESSION_MAX_AGE_MS
  }, [state.lastActivityAt])

  // Build context value
  const contextValue: SessionContextType = {
    ...state,
    setMode,
    setVenue,
    addMessage,
    clearConversation,
    setFilters,
    resetSession,
    isSessionStale,
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

// Hook to use session context
export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
