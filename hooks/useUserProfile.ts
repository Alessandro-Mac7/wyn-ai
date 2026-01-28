'use client'

import { useCallback, useMemo } from 'react'
import { useUser } from '@/contexts/user-context'
import type { UserProfile, UserPreferences, ConsentUpdate } from '@/types/user'

// ============================================
// HOOK: useUserProfile
// ============================================

export interface UseUserProfileReturn {
  // State
  profile: UserProfile | null
  preferences: UserPreferences | null
  isLoading: boolean
  isAuthenticated: boolean
  userId: string | null
  email: string | undefined

  // Computed properties
  displayName: string | null
  hasGdprConsent: boolean
  hasProfilingConsent: boolean
  hasMarketingConsent: boolean

  // Actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updateConsent: (consent: ConsentUpdate) => Promise<void>
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export function useUserProfile(): UseUserProfileReturn {
  const {
    user,
    profile,
    preferences: inferredPreferences,
    isLoading,
    isAuthenticated,
    updateProfile,
    updateConsent,
    refreshProfile,
    signOut,
  } = useUser()

  // Computed properties
  const displayName = useMemo(() => {
    return profile?.display_name || null
  }, [profile?.display_name])

  const hasGdprConsent = useMemo(() => {
    return !!profile?.gdpr_consent_at
  }, [profile?.gdpr_consent_at])

  const hasProfilingConsent = useMemo(() => {
    return profile?.profiling_consent ?? false
  }, [profile?.profiling_consent])

  const hasMarketingConsent = useMemo(() => {
    return profile?.marketing_consent ?? false
  }, [profile?.marketing_consent])

  const preferences = useMemo(() => {
    return inferredPreferences?.preferences ?? null
  }, [inferredPreferences?.preferences])

  return {
    // State
    profile,
    preferences,
    isLoading,
    isAuthenticated,
    userId: user?.id ?? null,
    email: user?.email,

    // Computed
    displayName,
    hasGdprConsent,
    hasProfilingConsent,
    hasMarketingConsent,

    // Actions
    updateProfile,
    updateConsent,
    refreshProfile,
    signOut,
  }
}

// ============================================
// HOOK: usePreferences
// Simplified hook for just accessing preferences
// ============================================

export interface UsePreferencesReturn {
  preferences: UserPreferences | null
  confidence: number
  isLoading: boolean
  hasPreferences: boolean
  // Specific preference helpers
  preferredWineTypes: string[]
  preferredRegions: string[]
  priceRange: { min?: number; max?: number } | null
  tasteProfile: UserPreferences['taste_profile'] | null
}

export function usePreferences(): UsePreferencesReturn {
  const { preferences: inferredPreferences, isLoading } = useUser()

  const preferences = inferredPreferences?.preferences ?? null
  const confidence = inferredPreferences?.confidence ?? 0

  return {
    preferences,
    confidence,
    isLoading,
    hasPreferences: !!preferences && Object.keys(preferences).length > 0,
    preferredWineTypes: preferences?.wine_types ?? [],
    preferredRegions: preferences?.regions ?? [],
    priceRange: preferences?.price_range ?? null,
    tasteProfile: preferences?.taste_profile ?? null,
  }
}

// ============================================
// HOOK: useRegistrationPrompt
// Logic for showing registration prompts
// ============================================

export interface UseRegistrationPromptReturn {
  shouldShowPrompt: boolean
  dismissPrompt: () => void
  canShowPrompt: boolean
}

const PROMPT_DISMISSED_KEY = 'wyn_registration_prompt_dismissed'
const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useRegistrationPrompt(messageCount: number): UseRegistrationPromptReturn {
  const { isAuthenticated, isLoading } = useUser()

  const canShowPrompt = useMemo(() => {
    // Don't show if loading or already authenticated
    if (isLoading || isAuthenticated) return false

    // Check if dismissed recently
    if (typeof window !== 'undefined') {
      const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY)
      if (dismissedAt) {
        const timeSinceDismissed = Date.now() - parseInt(dismissedAt, 10)
        if (timeSinceDismissed < PROMPT_COOLDOWN_MS) {
          return false
        }
      }
    }

    return true
  }, [isLoading, isAuthenticated])

  const shouldShowPrompt = useMemo(() => {
    if (!canShowPrompt) return false

    // Show after 3 messages
    return messageCount >= 3
  }, [canShowPrompt, messageCount])

  const dismissPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString())
    }
  }, [])

  return {
    shouldShowPrompt,
    dismissPrompt,
    canShowPrompt,
  }
}
