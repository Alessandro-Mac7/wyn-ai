// ============================================
// lib/venue-flow.ts
// Utilities for QR code to venue chat flow
// ============================================

const VISITED_KEY = 'wyn_visited'
const PENDING_VENUE_KEY = 'wyn_pending_venue'

/**
 * Check if user has visited before (for splash vs instant redirect)
 */
export function isFirstVisit(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(VISITED_KEY) !== 'true'
}

/**
 * Mark user as visited (call after first chat interaction)
 */
export function markAsVisited(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(VISITED_KEY, 'true')
}

/**
 * Store pending venue for PWA pickup
 */
export function setPendingVenue(slug: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PENDING_VENUE_KEY, slug)
}

/**
 * Get and clear pending venue (called by PWA on launch)
 */
export function getPendingVenue(): string | null {
  if (typeof window === 'undefined') return null
  const slug = localStorage.getItem(PENDING_VENUE_KEY)
  if (slug) {
    localStorage.removeItem(PENDING_VENUE_KEY)
  }
  return slug
}

/**
 * Check if running as installed PWA
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Check if we're in a browser (not PWA)
 */
export function isInBrowser(): boolean {
  return !isPWAInstalled()
}
