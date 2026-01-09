# PLAN-010: PWA Basic Caching & Install Prompt

## Overview

| Field | Value |
|-------|-------|
| **Feature** | PWA optimization with basic caching and install prompt |
| **Priority** | High |
| **Effort** | 8-12 hours |
| **Branch** | `feature/pwa-basic` |

## Scope

This plan covers **only**:
1. Service worker with static asset caching
2. Smart install prompt for engaged users

**Out of scope** (deferred):
- Offline page
- Wine list API caching
- Background sync
- Push notifications
- IndexedDB storage

---

## 1. Current State

### Existing PWA Infrastructure

**manifest.json** (already configured):
- App name, short name, description
- Display mode: standalone
- Theme colors: wine (#8f2436) and dark (#171312)
- Icons: 192px and 512px

**layout.tsx** (already configured):
- Manifest link
- Apple Web App meta tags
- Viewport theme color
- Safe area insets

### What's Missing
- Service worker (no caching)
- Install prompt UI
- PWA utilities

---

## 2. Technical Design

### 2.1 Service Worker Strategy

```
Caching Strategy:
┌─────────────────────────────────────────────────┐
│              CACHE FIRST (Static)               │
├─────────────────────────────────────────────────┤
│  • /_next/static/* (JS bundles)                 │
│  • /fonts/* (Inter font)                        │
│  • /icon-*.png (PWA icons)                      │
│  • /wyn-*.png (Logo images)                     │
│  • /apple-touch-icon.png                        │
│  • /manifest.json                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              NETWORK ONLY (Dynamic)             │
├─────────────────────────────────────────────────┤
│  • /api/* (All API routes)                      │
│  • Page navigations (HTML)                      │
└─────────────────────────────────────────────────┘
```

### 2.2 Install Prompt Behavior

```
Trigger Conditions (ALL must be true):
1. User has sent at least 2 chat messages
2. User has been on site for > 60 seconds
3. User has not dismissed prompt in this session
4. Browser fires beforeinstallprompt event
5. App is not already installed
```

### 2.3 File Structure

```
public/
├── sw.js                    # Service worker (NEW)
└── manifest.json            # Update with id, scope

components/
└── pwa/
    └── InstallPrompt.tsx    # Install banner (NEW)

lib/
└── pwa.ts                   # PWA utilities (NEW)

app/
└── layout.tsx               # Register service worker
```

---

## 3. Implementation Phases

### Phase 1: Service Worker with Basic Caching

#### 1.1 Create Service Worker (`public/sw.js`)

```javascript
const CACHE_NAME = 'wyn-cache-v1'

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/wyn-logo.png',
  '/wyn-icon.png',
  '/apple-touch-icon.png'
]

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch: cache-first for static, network-only for API/pages
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API routes - always network
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for static assets
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for everything else (pages)
  event.respondWith(fetch(request))
})
```

#### 1.2 Register Service Worker

Add to `app/layout.tsx` or create `components/pwa/ServiceWorkerRegistration.tsx`:

```typescript
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('SW registration failed:', error)
      })
    }
  }, [])

  return null
}
```

---

### Phase 2: Install Prompt Component

#### 2.1 PWA Utilities (`lib/pwa.ts`)

```typescript
// Track install prompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function initInstallPrompt(
  onPromptReady: () => void
): () => void {
  const handler = (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    onPromptReady()
  }

  window.addEventListener('beforeinstallprompt', handler)

  return () => {
    window.removeEventListener('beforeinstallprompt', handler)
  }
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false

  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null

  return outcome === 'accepted'
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}
```

#### 2.2 Install Prompt Component (`components/pwa/InstallPrompt.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { initInstallPrompt, showInstallPrompt, isAppInstalled } from '@/lib/pwa'

interface InstallPromptProps {
  messageCount: number  // Number of chat messages sent
}

export function InstallPrompt({ messageCount }: InstallPromptProps) {
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [timeOnSite, setTimeOnSite] = useState(0)

  // Track time on site
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnSite((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for install prompt
  useEffect(() => {
    if (isAppInstalled()) return

    const cleanup = initInstallPrompt(() => {
      setCanInstall(true)
    })

    return cleanup
  }, [])

  // Show conditions: 2+ messages, 60+ seconds, not dismissed, can install
  const shouldShow =
    canInstall &&
    !dismissed &&
    messageCount >= 2 &&
    timeOnSite >= 60

  const handleInstall = async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      setCanInstall(false)
    }
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={cn(
            'fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80',
            'p-4 rounded-xl',
            'bg-card border border-border',
            'shadow-lg z-50'
          )}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-wine/10 flex items-center justify-center">
              <Image
                src="/wyn-icon.png"
                alt="WYN"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Aggiungi WYN alla Home</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accesso rapido al tuo sommelier AI
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            className={cn(
              'w-full mt-3 py-2.5 px-4 rounded-lg',
              'flex items-center justify-center gap-2',
              'bg-wine text-white text-sm font-medium',
              'hover:bg-wine-dark transition-colors'
            )}
          >
            <Download className="h-4 w-4" />
            Installa App
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

#### 2.3 Export from components index

```typescript
// components/pwa/index.ts
export { InstallPrompt } from './InstallPrompt'
export { ServiceWorkerRegistration } from './ServiceWorkerRegistration'
```

---

### Phase 3: Integration

#### 3.1 Update Manifest

Add to `public/manifest.json`:

```json
{
  "id": "wyn-sommelier",
  "scope": "/",
  "orientation": "portrait",
  "lang": "it",
  "categories": ["food", "lifestyle"],
  "name": "WYN - AI Sommelier",
  "short_name": "WYN",
  "description": "Il tuo sommelier AI personale",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#171312",
  "theme_color": "#8f2436",
  "icons": [...]
}
```

#### 3.2 Add to Layout

In `app/layout.tsx`, add ServiceWorkerRegistration:

```typescript
import { ServiceWorkerRegistration } from '@/components/pwa'

// In the body:
<ServiceWorkerRegistration />
```

#### 3.3 Add InstallPrompt to Chat Page

In `app/chat/page.tsx`:

```typescript
import { InstallPrompt } from '@/components/pwa'

// Track message count from messages array
const userMessageCount = messages.filter(m => m.role === 'user').length

// In JSX:
<InstallPrompt messageCount={userMessageCount} />
```

---

## 4. Testing Checklist

### Service Worker
- [ ] SW registers successfully in production build
- [ ] Static assets are cached after first load
- [ ] Repeat visits load cached assets
- [ ] Cache version bump clears old cache
- [ ] API calls are not cached

### Install Prompt
- [ ] Prompt appears after 2+ messages and 60+ seconds
- [ ] Prompt does not appear if already installed
- [ ] Dismiss button hides prompt for session
- [ ] Install button triggers native prompt
- [ ] Works on Android Chrome
- [ ] Gracefully hidden on iOS (no beforeinstallprompt)

### General
- [ ] No console errors
- [ ] Lighthouse PWA score improves
- [ ] App works normally without SW (fallback)

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `public/sw.js` | CREATE | Service worker |
| `public/manifest.json` | MODIFY | Add id, scope, lang, categories |
| `lib/pwa.ts` | CREATE | PWA utilities |
| `components/pwa/InstallPrompt.tsx` | CREATE | Install banner |
| `components/pwa/ServiceWorkerRegistration.tsx` | CREATE | SW registration |
| `components/pwa/index.ts` | CREATE | Exports |
| `app/layout.tsx` | MODIFY | Add SW registration |
| `app/chat/page.tsx` | MODIFY | Add InstallPrompt |

---

## 6. Rollback Plan

If issues arise:
1. Remove `<ServiceWorkerRegistration />` from layout
2. Users will stop using SW on next visit
3. SW will be unregistered automatically when removed

Emergency unregister (add to console):
```javascript
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
```

---

## 7. Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Lighthouse PWA Score | 30 | 80+ |
| Repeat Visit LCP | ~2.5s | ~1.0s |
| Install Rate | 0% | 5%+ of engaged users |

---

## Approval

- [ ] Architect review
- [ ] UX review (install prompt design)
- [ ] Ready for implementation
