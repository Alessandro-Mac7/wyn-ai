// ============================================
// WYN - User Profile Types
// ============================================

import type { WineType } from './index'

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  // GDPR Consents
  gdpr_consent_at: string | null
  profiling_consent: boolean
  marketing_consent: boolean
  // Metadata
  created_at: string
  updated_at: string
}

export interface UserProfileUpdate {
  display_name?: string | null
  avatar_url?: string | null
}

// ============================================
// GDPR CONSENTS
// ============================================

export interface ConsentUpdate {
  gdpr_consent?: boolean // When true, sets gdpr_consent_at to NOW()
  profiling_consent?: boolean
  marketing_consent?: boolean
}

export interface ConsentStatus {
  gdpr_consent_at: string | null
  profiling_consent: boolean
  marketing_consent: boolean
}

// ============================================
// CHAT SESSIONS
// ============================================

export interface ChatSession {
  id: string
  user_id: string
  venue_id: string | null
  summary: ChatSessionSummary
  message_count: number
  wines_mentioned: string[]
  started_at: string
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatSessionSummary {
  topic?: string
  wines_discussed?: string[]
  recommendations?: string[]
  food_pairings?: string[]
}

export interface ChatSessionCreate {
  venue_id?: string | null
  summary?: ChatSessionSummary
  message_count?: number
  wines_mentioned?: string[]
}

export interface ChatSessionUpdate {
  summary?: ChatSessionSummary
  message_count?: number
  wines_mentioned?: string[]
  ended_at?: string
}

// ============================================
// INFERRED PREFERENCES
// ============================================

export interface InferredPreferences {
  id: string
  user_id: string
  preferences: UserPreferences
  confidence: number
  sources: string[]
  last_analyzed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  wine_types?: WineType[]
  taste_profile?: TasteProfile
  price_range?: PriceRange
  regions?: string[]
  grapes?: string[]
  food_pairings?: string[]
  occasions?: string[]
  avoid?: string[] // Things user doesn't like
}

export interface TasteProfile {
  sweetness?: 'dry' | 'off-dry' | 'sweet'
  body?: 'light' | 'medium' | 'full'
  tannins?: 'low' | 'medium' | 'high'
  acidity?: 'low' | 'medium' | 'high'
}

export interface PriceRange {
  min?: number
  max?: number
  currency?: string
}

// ============================================
// WINE SCANS
// ============================================

export interface WineScan {
  id: string
  user_id: string | null
  venue_id: string | null
  extracted_data: WineScanData
  matched_wine_id: string | null
  match_confidence: number | null
  scanned_at: string
  created_at: string
}

export interface WineScanData {
  name?: string
  producer?: string
  year?: number
  wine_type?: WineType
  region?: string
  denomination?: string
  grape_varieties?: string[]
}

// ============================================
// GDPR EXPORT
// ============================================

export interface UserDataExport {
  exported_at: string
  user_id: string
  profile: UserProfile | Record<string, never>
  chat_sessions: ChatSession[]
  preferences: InferredPreferences | Record<string, never>
  wine_scans: WineScan[]
}

// ============================================
// API TYPES
// ============================================

export interface UserProfileResponse {
  profile: UserProfile | null
  preferences: InferredPreferences | null
}

export interface AuthState {
  user: {
    id: string
    email?: string
  } | null
  profile: UserProfile | null
  preferences: InferredPreferences | null
  isLoading: boolean
  isAuthenticated: boolean
}
