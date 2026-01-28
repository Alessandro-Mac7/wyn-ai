/**
 * Simple in-memory rate limiter for API routes
 * For production at scale, consider Redis-based solution
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  })
}, CLEANUP_INTERVAL)

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetIn: number // seconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    }
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, config.limit - entry.count)
  const resetIn = Math.ceil((entry.resetTime - now) / 1000)

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetIn,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining,
    resetIn,
  }
}

/**
 * Get client identifier from request headers
 * Uses X-Forwarded-For for proxied requests, falls back to a default
 */
export function getClientIdentifier(headers: Headers): string {
  // Try X-Forwarded-For first (for proxied requests like Vercel)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(',')[0].trim()
  }

  // Try X-Real-IP
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback identifier
  return 'anonymous'
}

// Re-export rate limits from centralized config
export { RATE_LIMITS } from '@/config/constants'

/**
 * Apply rate limiting to an API request
 * Returns a 429 response if rate limited, or null if allowed
 */
export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  keyPrefix?: string
): NextResponse | null {
  const identifier = getClientIdentifier(request.headers)
  const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier
  const result = checkRateLimit(key, config)

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Troppe richieste. Riprova tra poco.',
        retryAfter: result.resetIn,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetIn),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetIn),
        },
      }
    )
  }

  return null
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(result.resetIn))
  return response
}
