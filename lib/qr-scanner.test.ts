import { describe, it, expect } from 'vitest'
import { isWynUrl, extractVenueSlug } from './qr-scanner'

describe('isWynUrl', () => {
  it('should accept wyn.app production URL', () => {
    expect(isWynUrl('https://wyn.app/v/trattoria-mario')).toBe(true)
  })

  it('should accept www.wyn.app', () => {
    expect(isWynUrl('https://www.wyn.app/v/osteria-bella')).toBe(true)
  })

  it('should accept localhost', () => {
    expect(isWynUrl('http://localhost:3000/v/test-venue')).toBe(true)
  })

  it('should accept Vercel preview URLs', () => {
    expect(isWynUrl('https://wyn-abc123.vercel.app/v/ristorante')).toBe(true)
  })

  it('should reject unknown domains', () => {
    expect(isWynUrl('https://example.com/v/ristorante')).toBe(false)
  })

  it('should reject non-URL strings', () => {
    expect(isWynUrl('not-a-url')).toBe(false)
  })

  it('should reject empty string', () => {
    expect(isWynUrl('')).toBe(false)
  })
})

describe('extractVenueSlug', () => {
  it('should extract slug from production URL', () => {
    expect(extractVenueSlug('https://wyn.app/v/trattoria-mario')).toBe('trattoria-mario')
  })

  it('should extract slug from localhost URL', () => {
    expect(extractVenueSlug('http://localhost:3000/v/test-venue')).toBe('test-venue')
  })

  it('should extract slug from Vercel preview URL', () => {
    expect(extractVenueSlug('https://wyn-abc123.vercel.app/v/osteria')).toBe('osteria')
  })

  it('should handle trailing slash', () => {
    expect(extractVenueSlug('https://wyn.app/v/ristorante/')).toBe('ristorante')
  })

  it('should handle slugs with underscores and numbers', () => {
    expect(extractVenueSlug('https://wyn.app/v/venue_123')).toBe('venue_123')
  })

  it('should return null for non-venue WYN URLs', () => {
    expect(extractVenueSlug('https://wyn.app/chat')).toBeNull()
  })

  it('should return null for root WYN URL', () => {
    expect(extractVenueSlug('https://wyn.app/')).toBeNull()
  })

  it('should return null for non-WYN domains', () => {
    expect(extractVenueSlug('https://example.com/v/test')).toBeNull()
  })

  it('should return null for invalid URLs', () => {
    expect(extractVenueSlug('not-a-url')).toBeNull()
  })

  it('should return null for /v/ without slug', () => {
    expect(extractVenueSlug('https://wyn.app/v/')).toBeNull()
  })

  it('should return null for nested paths after slug', () => {
    expect(extractVenueSlug('https://wyn.app/v/venue/extra')).toBeNull()
  })

  it('should ignore query params and still extract slug', () => {
    expect(extractVenueSlug('https://wyn.app/v/ristorante?from=qr')).toBe('ristorante')
  })
})
