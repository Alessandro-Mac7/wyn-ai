/**
 * QR Scanner Utilities
 *
 * Parses scanned QR code URLs to extract venue slugs for in-app navigation.
 */

/** Known WYN hosts (production, preview, local) */
const WYN_HOSTS = [
  'wyn.app',
  'www.wyn.app',
  'localhost',
]

/**
 * Check if a URL belongs to a WYN domain (production, Vercel preview, or localhost).
 */
export function isWynUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    // Exact match on known hosts
    if (WYN_HOSTS.includes(host)) return true

    // Vercel preview deployments: *.vercel.app
    if (host.endsWith('.vercel.app')) return true

    return false
  } catch {
    return false
  }
}

/**
 * Extract the venue slug from a WYN QR code URL.
 *
 * Expected URL format: https://wyn.app/v/[slug]
 * Returns the slug or null if the URL is not a valid WYN venue URL.
 */
export function extractVenueSlug(url: string): string | null {
  if (!isWynUrl(url)) return null

  try {
    const parsed = new URL(url)
    // Match /v/[slug] pattern
    const match = parsed.pathname.match(/^\/v\/([a-zA-Z0-9_-]+)\/?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
