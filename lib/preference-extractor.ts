import { chat } from './llm'
import { buildPreferenceExtractionMessages } from './prompts'
import type { ChatSession, UserPreferences, InferredPreferences } from '@/types/user'

// ============================================
// PREFERENCE EXTRACTION
// ============================================

const MIN_CONFIDENCE_THRESHOLD = 0.4
const MIN_SESSIONS_FOR_ANALYSIS = 2

/**
 * Extract preferences from a single conversation
 */
export async function extractPreferencesFromConversation(
  conversationText: string
): Promise<UserPreferences | null> {
  try {
    const messages = buildPreferenceExtractionMessages(conversationText)

    const response = await chat(messages)

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('No JSON found in LLM response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as UserPreferences

    // Validate and clean the response
    return validatePreferences(parsed)
  } catch (error) {
    console.error('Preference extraction error:', error)
    return null
  }
}

/**
 * Validate and clean extracted preferences
 */
function validatePreferences(raw: UserPreferences): UserPreferences | null {
  const valid: UserPreferences = {}

  // Validate wine_types
  if (Array.isArray(raw.wine_types)) {
    const validTypes = ['red', 'white', 'rose', 'sparkling', 'dessert']
    const filteredTypes = raw.wine_types.filter(t => validTypes.includes(t)) as UserPreferences['wine_types']
    if (filteredTypes && filteredTypes.length > 0) {
      valid.wine_types = filteredTypes
    }
  }

  // Validate taste_profile
  if (raw.taste_profile && typeof raw.taste_profile === 'object') {
    const tp: UserPreferences['taste_profile'] = {}
    const sweetnessOptions = ['dry', 'off-dry', 'sweet']
    const bodyOptions = ['light', 'medium', 'full']
    const tanninOptions = ['low', 'medium', 'high']
    const acidityOptions = ['low', 'medium', 'high']

    if (sweetnessOptions.includes(raw.taste_profile.sweetness!)) {
      tp.sweetness = raw.taste_profile.sweetness
    }
    if (bodyOptions.includes(raw.taste_profile.body!)) {
      tp.body = raw.taste_profile.body
    }
    if (tanninOptions.includes(raw.taste_profile.tannins!)) {
      tp.tannins = raw.taste_profile.tannins
    }
    if (acidityOptions.includes(raw.taste_profile.acidity!)) {
      tp.acidity = raw.taste_profile.acidity
    }

    if (Object.keys(tp).length > 0) {
      valid.taste_profile = tp
    }
  }

  // Validate price_range
  if (raw.price_range && typeof raw.price_range === 'object') {
    const pr: UserPreferences['price_range'] = {}
    if (typeof raw.price_range.min === 'number' && raw.price_range.min > 0) {
      pr.min = raw.price_range.min
    }
    if (typeof raw.price_range.max === 'number' && raw.price_range.max > 0) {
      pr.max = raw.price_range.max
    }
    if (Object.keys(pr).length > 0) {
      valid.price_range = pr
    }
  }

  // Validate string arrays
  if (Array.isArray(raw.regions) && raw.regions.length > 0) {
    valid.regions = raw.regions.filter(r => typeof r === 'string' && r.trim()).slice(0, 10)
    if (valid.regions.length === 0) delete valid.regions
  }

  if (Array.isArray(raw.grapes) && raw.grapes.length > 0) {
    valid.grapes = raw.grapes.filter(g => typeof g === 'string' && g.trim()).slice(0, 10)
    if (valid.grapes.length === 0) delete valid.grapes
  }

  if (Array.isArray(raw.food_pairings) && raw.food_pairings.length > 0) {
    valid.food_pairings = raw.food_pairings.filter(f => typeof f === 'string' && f.trim()).slice(0, 10)
    if (valid.food_pairings.length === 0) delete valid.food_pairings
  }

  if (Array.isArray(raw.occasions) && raw.occasions.length > 0) {
    valid.occasions = raw.occasions.filter(o => typeof o === 'string' && o.trim()).slice(0, 5)
    if (valid.occasions.length === 0) delete valid.occasions
  }

  if (Array.isArray(raw.avoid) && raw.avoid.length > 0) {
    valid.avoid = raw.avoid.filter(a => typeof a === 'string' && a.trim()).slice(0, 5)
    if (valid.avoid.length === 0) delete valid.avoid
  }

  // Return null if no valid preferences found
  return Object.keys(valid).length > 0 ? valid : null
}

/**
 * Merge multiple preference sets into one, with weighted averaging
 */
export function mergePreferences(
  existing: UserPreferences | null,
  newPrefs: UserPreferences,
  existingWeight: number = 0.7
): UserPreferences {
  if (!existing) return newPrefs

  const merged: UserPreferences = {}
  const newWeight = 1 - existingWeight

  // Merge wine_types (union with preference for existing)
  const allTypes = new Set([
    ...(existing.wine_types || []),
    ...(newPrefs.wine_types || []),
  ])
  if (allTypes.size > 0) {
    merged.wine_types = Array.from(allTypes) as UserPreferences['wine_types']
  }

  // Merge taste_profile (prefer existing if both present)
  if (existing.taste_profile || newPrefs.taste_profile) {
    merged.taste_profile = {
      sweetness: existing.taste_profile?.sweetness || newPrefs.taste_profile?.sweetness,
      body: existing.taste_profile?.body || newPrefs.taste_profile?.body,
      tannins: existing.taste_profile?.tannins || newPrefs.taste_profile?.tannins,
      acidity: existing.taste_profile?.acidity || newPrefs.taste_profile?.acidity,
    }
    // Clean undefined values
    Object.keys(merged.taste_profile).forEach(key => {
      if (merged.taste_profile![key as keyof typeof merged.taste_profile] === undefined) {
        delete merged.taste_profile![key as keyof typeof merged.taste_profile]
      }
    })
    if (Object.keys(merged.taste_profile).length === 0) {
      delete merged.taste_profile
    }
  }

  // Merge price_range (weighted average)
  if (existing.price_range || newPrefs.price_range) {
    const ep = existing.price_range || {}
    const np = newPrefs.price_range || {}
    merged.price_range = {}

    if (ep.min !== undefined && np.min !== undefined) {
      merged.price_range.min = Math.round(ep.min * existingWeight + np.min * newWeight)
    } else {
      merged.price_range.min = ep.min || np.min
    }

    if (ep.max !== undefined && np.max !== undefined) {
      merged.price_range.max = Math.round(ep.max * existingWeight + np.max * newWeight)
    } else {
      merged.price_range.max = ep.max || np.max
    }

    if (merged.price_range.min === undefined && merged.price_range.max === undefined) {
      delete merged.price_range
    }
  }

  // Merge string arrays (union with limit)
  const mergeArrays = (a: string[] | undefined, b: string[] | undefined, limit: number) => {
    const set = new Set([...(a || []), ...(b || [])])
    return set.size > 0 ? Array.from(set).slice(0, limit) : undefined
  }

  merged.regions = mergeArrays(existing.regions, newPrefs.regions, 10)
  merged.grapes = mergeArrays(existing.grapes, newPrefs.grapes, 10)
  merged.food_pairings = mergeArrays(existing.food_pairings, newPrefs.food_pairings, 10)
  merged.occasions = mergeArrays(existing.occasions, newPrefs.occasions, 5)
  merged.avoid = mergeArrays(existing.avoid, newPrefs.avoid, 5)

  // Clean undefined values
  Object.keys(merged).forEach(key => {
    if (merged[key as keyof UserPreferences] === undefined) {
      delete merged[key as keyof UserPreferences]
    }
  })

  return merged
}

/**
 * Calculate confidence score based on data quality
 */
export function calculateConfidence(
  preferences: UserPreferences,
  sessionCount: number
): number {
  let score = 0
  let maxScore = 0

  // Weight for different preference types
  const weights = {
    wine_types: 15,
    taste_profile: 25,
    price_range: 15,
    regions: 10,
    grapes: 10,
    food_pairings: 15,
    occasions: 5,
    avoid: 5,
  }

  // Calculate score based on presence and quality
  if (preferences.wine_types?.length) {
    score += weights.wine_types * Math.min(preferences.wine_types.length / 2, 1)
    maxScore += weights.wine_types
  } else {
    maxScore += weights.wine_types
  }

  if (preferences.taste_profile) {
    const tpKeys = Object.keys(preferences.taste_profile).length
    score += weights.taste_profile * (tpKeys / 4)
    maxScore += weights.taste_profile
  } else {
    maxScore += weights.taste_profile
  }

  if (preferences.price_range) {
    const prKeys = Object.keys(preferences.price_range).length
    score += weights.price_range * (prKeys / 2)
    maxScore += weights.price_range
  } else {
    maxScore += weights.price_range
  }

  if (preferences.regions?.length) {
    score += weights.regions
    maxScore += weights.regions
  } else {
    maxScore += weights.regions
  }

  if (preferences.grapes?.length) {
    score += weights.grapes
    maxScore += weights.grapes
  } else {
    maxScore += weights.grapes
  }

  if (preferences.food_pairings?.length) {
    score += weights.food_pairings
    maxScore += weights.food_pairings
  } else {
    maxScore += weights.food_pairings
  }

  if (preferences.occasions?.length) {
    score += weights.occasions
    maxScore += weights.occasions
  } else {
    maxScore += weights.occasions
  }

  if (preferences.avoid?.length) {
    score += weights.avoid
    maxScore += weights.avoid
  } else {
    maxScore += weights.avoid
  }

  // Boost confidence based on session count
  const sessionBoost = Math.min(sessionCount / 5, 1) * 0.2

  // Calculate final confidence (0-1)
  const baseConfidence = maxScore > 0 ? score / maxScore : 0
  return Math.min(baseConfidence + sessionBoost, 1)
}

/**
 * Build conversation text from session summaries
 */
export function buildConversationText(sessions: ChatSession[]): string {
  return sessions
    .map(session => {
      const parts: string[] = []
      if (session.summary?.topic) {
        parts.push(`Argomento: ${session.summary.topic}`)
      }
      if (session.summary?.wines_discussed?.length) {
        parts.push(`Vini discussi: ${session.summary.wines_discussed.join(', ')}`)
      }
      if (session.wines_mentioned?.length) {
        parts.push(`Vini menzionati: ${session.wines_mentioned.join(', ')}`)
      }
      return parts.join('\n')
    })
    .filter(text => text.trim())
    .join('\n\n---\n\n')
}
