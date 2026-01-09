// WYN Service Worker with Smart Caching
// Version: timestamp-based for automatic cache busting

const CACHE_VERSION = `wyn-cache-${Date.now()}`

// Assets to precache on install
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/wyn-logo.png',
  '/wyn-icon.png',
  '/apple-touch-icon.png'
]

// Install: precache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('Failed to precache assets:', error)
      })
    })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wyn-cache-') && name !== CACHE_VERSION)
          .map((name) => {
            console.log('Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Claim clients immediately
  self.clients.claim()
})

// Fetch: Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // NEVER cache API routes - always network-only
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Stale-while-revalidate for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff2?)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      staleWhileRevalidate(request)
    )
    return
  }

  // Network-first for HTML pages (no cache fallback)
  if (url.pathname === '/' || !url.pathname.includes('.')) {
    event.respondWith(
      fetch(request).catch((error) => {
        console.error('Network request failed:', error)
        // No offline fallback for MVP
        throw error
      })
    )
    return
  }

  // Default: network-only
})

/**
 * Stale-while-revalidate strategy
 * 1. Return cached response immediately (if exists)
 * 2. Fetch fresh response in background
 * 3. Update cache with fresh response
 * 4. Next request gets fresh content
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)

  // Fetch fresh response in background
  const fetchPromise = fetch(request).then((response) => {
    // Only cache successful responses
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch((error) => {
    console.error('Fetch failed:', error)
    // If cached exists, error is not critical
    throw error
  })

  // Return cached immediately, or wait for fetch
  return cached || fetchPromise
}
