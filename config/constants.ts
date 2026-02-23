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
// EMBEDDINGS
// ============================================

/** OpenAI embedding model */
export const EMBEDDING_MODEL = 'text-embedding-3-small'

/** Dimensions of the embedding vector */
export const EMBEDDING_DIMENSIONS = 1536

/** Maximum texts per OpenAI embeddings API call */
export const EMBEDDING_BATCH_SIZE = 2048

/** Maximum retry attempts for embedding API calls */
export const EMBEDDING_MAX_RETRIES = 3

/** Initial delay for retry backoff (milliseconds) */
export const EMBEDDING_RETRY_DELAY_MS = 1000

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
// RAG (Retrieval Augmented Generation)
// ============================================

/** Wine count threshold: use RAG above this, full context below (RULE-008) */
export const RAG_THRESHOLD = 50

/** Number of wines to retrieve in RAG search */
export const RAG_TOP_K = 8

/** Minimum similarity score for RAG results */
export const RAG_SIMILARITY_THRESHOLD = 0.4

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

  /** Wine analysis endpoint: requests per minute (OCR + LLM = expensive) */
  analyzeWine: { limit: 5, windowSeconds: 60 },

  /** General API: requests per minute */
  general: { limit: 60, windowSeconds: 60 },

  /** User data export: requests per 5 minutes (GDPR) */
  export: { limit: 5, windowSeconds: 300 },

  /** Account deletion: requests per hour (very strict) */
  deleteAccount: { limit: 3, windowSeconds: 3600 },

  /** Consent updates: requests per minute */
  consent: { limit: 10, windowSeconds: 60 },

  /** User profile: requests per minute */
  profile: { limit: 30, windowSeconds: 60 },
} as const

// ============================================
// MEMORY SYSTEM
// ============================================

/** Minimum similarity score for memory retrieval */
export const MEMORY_SIMILARITY_THRESHOLD = 0.3

/** Similarity threshold for deduplication (higher = stricter) */
export const MEMORY_DEDUP_THRESHOLD = 0.9

/** Number of memories to retrieve by default */
export const MEMORY_TOP_K = 5

/** Maximum fragments to extract per session */
export const MEMORY_MAX_FRAGMENTS_PER_SESSION = 5
