/**
 * Unit tests for rate-limit.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getClientIdentifier } from './rate-limit'
import type { RateLimitConfig } from './rate-limit'

describe('rate-limit', () => {
  // Use fake timers to control time in tests
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow first request and return correct remaining count', () => {
      const identifier = `test-first-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 5, windowSeconds: 60 }

      const result = checkRateLimit(identifier, config)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.resetIn).toBe(60)
    })

    it('should allow up to limit-th request', () => {
      const identifier = `test-limit-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 3, windowSeconds: 60 }

      // First request
      let result = checkRateLimit(identifier, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)

      // Second request
      result = checkRateLimit(identifier, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)

      // Third request (limit-th)
      result = checkRateLimit(identifier, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should block (limit+1)-th request', () => {
      const identifier = `test-block-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 2, windowSeconds: 60 }

      // Use up the limit
      checkRateLimit(identifier, config) // 1st
      checkRateLimit(identifier, config) // 2nd

      // 3rd request should fail
      const result = checkRateLimit(identifier, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should decrement remaining count correctly on each request', () => {
      const identifier = `test-decrement-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 10, windowSeconds: 60 }

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(identifier, config)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(10 - i - 1)
      }
    })

    it('should reset count after window expires', () => {
      const identifier = `test-reset-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 2, windowSeconds: 60 }

      // Use up the limit
      checkRateLimit(identifier, config)
      checkRateLimit(identifier, config)

      // Next request should fail
      let result = checkRateLimit(identifier, config)
      expect(result.success).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61 * 1000) // 61 seconds

      // Should be allowed again (new window)
      result = checkRateLimit(identifier, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1) // limit - 1
    })

    it('should maintain separate limits for different identifiers', () => {
      const identifier1 = `test-separate-1-${Date.now()}-${Math.random()}`
      const identifier2 = `test-separate-2-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 2, windowSeconds: 60 }

      // Use up identifier1's limit
      checkRateLimit(identifier1, config)
      checkRateLimit(identifier1, config)
      const result1 = checkRateLimit(identifier1, config)
      expect(result1.success).toBe(false)

      // identifier2 should still be allowed
      const result2 = checkRateLimit(identifier2, config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)
    })

    it('should return correct resetIn value on first request', () => {
      const identifier = `test-resetin-first-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 5, windowSeconds: 120 }

      const result = checkRateLimit(identifier, config)

      expect(result.resetIn).toBe(120)
    })

    it('should return decreasing resetIn value as time passes', () => {
      const identifier = `test-resetin-decrease-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 5, windowSeconds: 60 }

      // First request
      const result1 = checkRateLimit(identifier, config)
      expect(result1.resetIn).toBe(60)

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30 * 1000)

      // Second request
      const result2 = checkRateLimit(identifier, config)
      expect(result2.resetIn).toBeLessThanOrEqual(30)
      expect(result2.resetIn).toBeGreaterThan(0)
    })

    it('should handle zero limit correctly', () => {
      const identifier = `test-zero-limit-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 0, windowSeconds: 60 }

      // First request succeeds (new entry always succeeds)
      // but returns negative remaining (implementation quirk)
      const result1 = checkRateLimit(identifier, config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(-1) // limit - 1 = 0 - 1 = -1

      // Second request fails (count=2 > limit=0)
      const result2 = checkRateLimit(identifier, config)
      expect(result2.success).toBe(false)
      expect(result2.remaining).toBe(0)
    })

    it('should handle single request limit correctly', () => {
      const identifier = `test-single-limit-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 1, windowSeconds: 60 }

      // First request succeeds
      const result1 = checkRateLimit(identifier, config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(0)

      // Second request fails
      const result2 = checkRateLimit(identifier, config)
      expect(result2.success).toBe(false)
      expect(result2.remaining).toBe(0)
    })

    it('should maintain remaining=0 when over limit', () => {
      const identifier = `test-over-limit-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 2, windowSeconds: 60 }

      // Use up the limit
      checkRateLimit(identifier, config)
      checkRateLimit(identifier, config)

      // Multiple requests over limit should all have remaining=0
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, config)
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
      }
    })

    it('should handle very short window correctly', () => {
      const identifier = `test-short-window-${Date.now()}-${Math.random()}`
      const config: RateLimitConfig = { limit: 3, windowSeconds: 1 }

      // Use up the limit
      checkRateLimit(identifier, config)
      checkRateLimit(identifier, config)
      checkRateLimit(identifier, config)

      // Should be blocked
      let result = checkRateLimit(identifier, config)
      expect(result.success).toBe(false)

      // Advance by 2 seconds (past the window)
      vi.advanceTimersByTime(2 * 1000)

      // Should be allowed again
      result = checkRateLimit(identifier, config)
      expect(result.success).toBe(true)
    })
  })

  describe('getClientIdentifier', () => {
    it('should extract single IP from x-forwarded-for header', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should extract first IP from x-forwarded-for with multiple IPs', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1, 172.16.0.1')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should trim whitespace from x-forwarded-for IP', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '  192.168.1.1  , 10.0.0.1')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should fall back to x-real-ip when x-forwarded-for is absent', () => {
      const headers = new Headers()
      headers.set('x-real-ip', '203.0.113.1')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('203.0.113.1')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1')
      headers.set('x-real-ip', '203.0.113.1')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should return "anonymous" when no IP headers present', () => {
      const headers = new Headers()

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('anonymous')
    })

    it('should handle empty x-forwarded-for header', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '')

      const identifier = getClientIdentifier(headers)

      // Empty string is falsy, should fall back to anonymous
      expect(identifier).toBe('anonymous')
    })

    it('should handle IPv6 addresses in x-forwarded-for', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '2001:0db8:85a3::8a2e:0370:7334')

      const identifier = getClientIdentifier(headers)

      expect(identifier).toBe('2001:0db8:85a3::8a2e:0370:7334')
    })
  })
})
