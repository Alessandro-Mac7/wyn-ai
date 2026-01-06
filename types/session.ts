import type { ChatMessage, Venue, WineType } from './index'

// Chat mode types
export type ChatMode = 'general' | 'venue'

// Session filters for wine filtering in venue mode
export interface SessionFilters {
  wineTypes: WineType[]
}

// Complete session state structure
export interface SessionState {
  // Mode & Venue
  mode: ChatMode
  venueSlug: string | null
  venueData: Venue | null

  // Conversation
  messages: ChatMessage[]
  conversationStartedAt: number | null

  // Filters (for venue mode)
  filters: SessionFilters

  // Metadata
  lastActivityAt: number
  version: number
}

// Session actions interface
export interface SessionActions {
  // Mode management
  setMode: (mode: ChatMode) => void
  setVenue: (venue: Venue | null) => void

  // Conversation
  addMessage: (message: ChatMessage) => void
  clearConversation: () => void

  // Filters
  setFilters: (filters: SessionFilters) => void

  // Session lifecycle
  resetSession: () => void
  isSessionStale: () => boolean
}

// Combined context type
export interface SessionContextType extends SessionState, SessionActions {}

// Initial state factory
export function createInitialSessionState(): SessionState {
  return {
    mode: 'general',
    venueSlug: null,
    venueData: null,
    messages: [],
    conversationStartedAt: null,
    filters: { wineTypes: [] },
    lastActivityAt: Date.now(),
    version: 1,
  }
}
