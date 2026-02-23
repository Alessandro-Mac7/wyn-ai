/**
 * Embeddings module for text vectorization
 * Uses OpenAI text-embedding-3-small for semantic search and similarity
 */

import { createHash } from 'crypto'
import {
  EMBEDDING_MODEL,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_MAX_RETRIES,
  EMBEDDING_RETRY_DELAY_MS,
} from '@/config/constants'

// ============================================
// TYPES
// ============================================

interface EmbeddingResponse {
  object: string
  data: Array<{
    object: string
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// ============================================
// OPENAI EMBEDDINGS CLIENT
// ============================================

/**
 * Calls OpenAI Embeddings API with retry logic
 */
async function callEmbeddingsAPI(
  texts: string[],
  attempt: number = 0
): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI Embeddings API error:', response.status, errorText)

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`OpenAI Embeddings API error: ${response.status}`)
      }

      // Retry on server errors (5xx) or rate limits (429)
      if (attempt < EMBEDDING_MAX_RETRIES - 1) {
        const delay = EMBEDDING_RETRY_DELAY_MS * Math.pow(2, attempt)
        console.error(
          `Embeddings API call failed (attempt ${attempt + 1}/${EMBEDDING_MAX_RETRIES}), retrying in ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        return callEmbeddingsAPI(texts, attempt + 1)
      }

      throw new Error(`OpenAI Embeddings API error: ${response.status}`)
    }

    const data: EmbeddingResponse = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid OpenAI Embeddings response format')
    }

    // Sort by index to ensure correct order (API may return out of order)
    const sortedData = data.data.sort((a, b) => a.index - b.index)

    // Extract embeddings
    return sortedData.map((item) => item.embedding)
  } catch (error) {
    // If we've exhausted retries, throw the error
    if (attempt >= EMBEDDING_MAX_RETRIES - 1) {
      throw error
    }

    // Check if error is retryable
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('400') || message.includes('401') || message.includes('403')) {
      throw error
    }

    // Retry on network errors or server errors
    const delay = EMBEDDING_RETRY_DELAY_MS * Math.pow(2, attempt)
    console.error(
      `Embeddings API call failed (attempt ${attempt + 1}/${EMBEDDING_MAX_RETRIES}), retrying in ${delay}ms...`
    )
    await new Promise((resolve) => setTimeout(resolve, delay))
    return callEmbeddingsAPI(texts, attempt + 1)
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Embeds a single text using OpenAI text-embedding-3-small
 *
 * @param text - Text to embed
 * @returns 1536-dimensional embedding vector
 * @throws Error if API call fails after retries
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text')
  }

  const embeddings = await callEmbeddingsAPI([text])
  return embeddings[0]
}

/**
 * Embeds multiple texts in batches using OpenAI text-embedding-3-small
 * OpenAI supports up to 2048 texts per call - this function automatically batches
 *
 * @param texts - Array of texts to embed
 * @returns Array of 1536-dimensional embedding vectors (same order as input)
 * @throws Error if API call fails after retries
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  // Filter out empty texts and track indices
  const nonEmptyTexts: string[] = []
  const nonEmptyIndices: number[] = []

  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      nonEmptyTexts.push(text)
      nonEmptyIndices.push(index)
    }
  })

  if (nonEmptyTexts.length === 0) {
    throw new Error('Cannot embed all empty texts')
  }

  // Split into batches of EMBEDDING_BATCH_SIZE (2048)
  const batches: string[][] = []
  for (let i = 0; i < nonEmptyTexts.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(nonEmptyTexts.slice(i, i + EMBEDDING_BATCH_SIZE))
  }

  console.log(
    `[EMBEDDINGS] Processing ${nonEmptyTexts.length} texts in ${batches.length} batch(es)`
  )

  // Process all batches
  const batchResults: number[][][] = []
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`[EMBEDDINGS] Processing batch ${i + 1}/${batches.length} (${batch.length} texts)`)
    const embeddings = await callEmbeddingsAPI(batch)
    batchResults.push(embeddings)
  }

  // Flatten results back into single array
  const allEmbeddings = batchResults.flat()

  // Create result array with same length as input, using null for empty texts
  const result: number[][] = new Array(texts.length)
  nonEmptyIndices.forEach((originalIndex, resultIndex) => {
    result[originalIndex] = allEmbeddings[resultIndex]
  })

  return result
}

/**
 * Generates a SHA-256 hash of text content for change detection
 * Use this to detect if content has changed and needs re-embedding
 *
 * @param text - Text to hash
 * @returns Hex string hash
 */
export function generateContentHash(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex')
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculates cosine similarity between two embedding vectors
 * Returns a value between -1 (opposite) and 1 (identical)
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Checks if OpenAI API key is configured
 * Useful for feature availability checks
 */
export function isEmbeddingAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}
