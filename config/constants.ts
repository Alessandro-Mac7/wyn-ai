/**
 * Centralized application constants
 * Avoid magic numbers scattered throughout the codebase
 */

// ============================================
// PAGINATION
// ============================================

/** Default page size for wine listing */
export const WINES_PAGE_SIZE = 50

/** Maximum wines allowed in bulk import */
export const BULK_IMPORT_MAX_SIZE = 100

// ============================================
// ENRICHMENT
// ============================================

/** Minimum confidence score for ratings (RULE-006) */
export const MIN_RATING_CONFIDENCE = 0.4

/** Maximum retry attempts for enrichment LLM calls */
export const ENRICHMENT_MAX_RETRIES = 3

/** Initial delay for retry backoff (milliseconds) */
export const ENRICHMENT_RETRY_DELAY_MS = 1000

// ============================================
// CHAT
// ============================================

/** Maximum characters allowed in chat input */
export const CHAT_MAX_CHARACTERS = 2000

/** Debounce delay for search input (milliseconds) */
export const SEARCH_DEBOUNCE_MS = 300

// ============================================
// FILE UPLOADS
// ============================================

/** Maximum CSV file size (5MB) */
export const CSV_MAX_FILE_SIZE = 5 * 1024 * 1024

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMITS = {
  /** Chat endpoint: requests per minute */
  chat: { limit: 30, windowSeconds: 60 },

  /** Enrichment endpoint: requests per minute */
  enrichment: { limit: 20, windowSeconds: 60 },

  /** Auth endpoints: requests per minute (stricter for security) */
  auth: { limit: 10, windowSeconds: 60 },

  /** Bulk operations: requests per minute */
  bulk: { limit: 5, windowSeconds: 60 },

  /** Scan label endpoint: requests per minute (vision API is expensive) */
  scan: { limit: 10, windowSeconds: 60 },

  /** General API: requests per minute */
  general: { limit: 60, windowSeconds: 60 },
} as const
