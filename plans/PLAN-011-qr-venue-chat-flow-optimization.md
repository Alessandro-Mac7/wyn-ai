# PLAN-011: QR Code to Venue Chat Flow Optimization

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Reduce friction from QR scan to venue chat |
| **Priority** | High |
| **Effort** | 6-8 hours |
| **Branch** | `feature/qr-chat-flow` |
| **Status** | APPROVED |

---

## 1. Problem Statement

### 1.1 Current Flow (Too Many Steps)

```
                     CURRENT FLOW
                     ============

    [QR Code Scan]
          |
          v
    [Safari Opens]  <-- iOS limitation: QR always opens Safari, never PWA
          |
          v
    [/v/[slug] Landing Page]
          |
          | User reads venue info
          | User clicks "Inizia a Esplorare i Vini"
          v
    [Navigation to /chat?venue=slug]
          |
          | Page loads
          | URL params processed
          | Venue data fetched (again)
          v
    [Chat Ready]

    Total: 2 page loads, 1 user action, ~3-5 seconds
```

### 1.2 Problems Identified

| Problem | Impact | Severity |
|---------|--------|----------|
| Landing page adds friction | User must click button to start | High |
| Double venue fetch | /v/[slug] fetches, then /chat fetches again | Medium |
| iOS QR always opens Safari | PWA users still land in browser | High |
| No venue persistence for PWA | If user installs PWA later, loses venue context | Medium |
| URL params cleared after load | No deep linking back to venue | Low |

### 1.3 User Scenarios

**Scenario A: First-time user at restaurant**
1. Scans QR code at table
2. Lands in Safari (iOS) or Chrome (Android)
3. Wants to immediately ask about wines
4. Current: Must click button, wait for second page load

**Scenario B: Returning user with PWA installed**
1. Has WYN PWA installed on phone
2. Scans QR code at new restaurant
3. QR opens Safari (not PWA)
4. Starts chatting in Safari
5. Closes Safari, opens PWA
6. PWA has no knowledge of the venue they just visited

**Scenario C: Same venue, different visits**
1. User visited venue yesterday
2. Returns today, scans QR again
3. Should remember previous context (recent venues feature)

---

## 2. Goals and Non-Goals

### 2.1 Goals

| Goal | Success Metric |
|------|----------------|
| Reduce steps from QR scan to chat | 1 page load, 0 clicks |
| Persist venue across browser to PWA | localStorage sync works cross-session |
| Handle iOS QR limitation gracefully | Smart redirect when PWA is available |
| Maintain good UX for invalid venues | Graceful fallback to general mode |
| Support venue memory for returning users | Last 5 venues remembered |

### 2.2 Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Force PWA installation | User choice, not UX friction |
| Custom URL schemes for PWA | Not reliable, complex |
| Universal links / App links | Requires domain verification, out of scope |
| Analytics on QR scans | Privacy concerns, not MVP |

---

## 3. Recommended Architecture

### 3.1 Decision: Direct-to-Chat with Server-Side Venue Loading

**The landing page serves no essential purpose.** Users at a restaurant want to chat about wines immediately, not read a description they can see on the chat header.

```
                     PROPOSED FLOW
                     =============

    [QR Code Scan]
          |
          v
    [Safari/Chrome Opens]
          |
          v
    [/v/[slug] (Server Component)]
          |
          | Server-side venue validation
          | If valid: redirect to /chat?venue=slug&from=qr
          | If invalid: redirect to /chat?venue_error=slug
          v
    [/chat Page Loads]
          |
          | URL params processed
          | Venue loaded (with loading state)
          | QR source detected (from=qr)
          | PWA smart banner shown
          v
    [Chat Ready - User can start immediately]

    Total: 1 page load, 0 user actions, ~2-3 seconds
```

### 3.2 Key Design Decisions

#### Decision 1: Remove Landing Page, Use Server Redirect

**Current:**
```typescript
// app/v/[slug]/page.tsx - Client component with UI
export default function VenuePage({ params }) {
  // Fetch venue, show UI, wait for click
  const handleStartChat = () => router.push(`/chat?venue=${slug}`)
}
```

**Proposed:**
```typescript
// app/v/[slug]/page.tsx - Server component with redirect
import { redirect } from 'next/navigation'

export default async function VenuePage({ params }) {
  const { slug } = await params

  // Validate venue exists (fast DB check)
  const venueExists = await checkVenueExists(slug)

  if (venueExists) {
    redirect(`/chat?venue=${slug}&from=qr`)
  } else {
    redirect(`/chat?venue_error=${slug}`)
  }
}
```

**Rationale:**
- Server redirect is faster than client navigation
- Validation happens once, not twice
- No JavaScript needed on landing page
- Progressive enhancement (works without JS)

#### Decision 2: Venue Persistence Strategy

**Multi-layer storage approach:**

```
                VENUE PERSISTENCE LAYERS
                ========================

    Layer 1: URL Parameters (Ephemeral)
    ┌─────────────────────────────────────┐
    │ /chat?venue=osteria-del-sole       │
    │ - Immediate context                 │
    │ - Cleared after processing          │
    │ - Source of truth on first load     │
    └─────────────────────────────────────┘
                    |
                    v
    Layer 2: Session Storage (Tab-scoped)
    ┌─────────────────────────────────────┐
    │ sessionStorage['wyn_active_venue']  │
    │ - Current tab context               │
    │ - Survives page refreshes           │
    │ - Lost when tab closes              │
    └─────────────────────────────────────┘
                    |
                    v
    Layer 3: Local Storage (Device-scoped)
    ┌─────────────────────────────────────┐
    │ localStorage['wyn_session']         │
    │ - Full session state                │
    │ - 4-hour TTL                        │
    │ - Syncs across browser/PWA          │
    └─────────────────────────────────────┘
                    |
                    v
    Layer 4: Recent Venues (Persistent)
    ┌─────────────────────────────────────┐
    │ localStorage['wyn_recent_venues']   │
    │ - Last 5 venues visited             │
    │ - No TTL                            │
    │ - For venue selector                │
    └─────────────────────────────────────┘
```

**Existing implementation already handles Layer 3 and 4.**
We need to ensure Layer 2 is properly populated for tab context.

#### Decision 3: PWA Deep Link Smart Banner

Since iOS cannot open PWA from QR codes, we show a smart banner:

```
    ┌────────────────────────────────────────────────────────────┐
    │  [WYN icon]  Apri nell'app WYN                    [Apri]  │
    │              Esperienza migliore, accesso offline         │
    └────────────────────────────────────────────────────────────┘

    Shows when:
    - URL has from=qr param
    - PWA is installed (detected via display-mode)
    - User is in Safari/Chrome (not PWA)

    "Apri" button:
    - Copies venue slug to localStorage
    - Opens PWA (cannot pass venue directly)
    - PWA detects pending venue on launch
```

**Implementation Note:** This is a "best effort" solution. iOS/Safari limitations make it impossible to directly open PWA with parameters. The approach:

1. Store `wyn_pending_venue` in localStorage
2. Open PWA via `window.open('/', '_blank')` (may not work on all browsers)
3. When PWA opens, check for pending venue and load it

**Alternative for iOS:** Show instructions to manually open the app, since programmatic PWA launch is unreliable.

#### Decision 4: Invalid Venue Handling

**Current behavior:** Shows error page with "Torna alla Home" button.

**Proposed behavior:** Redirect to chat with warning, allow user to continue.

```typescript
// In /chat page, handle venue_error param
if (venueErrorParam) {
  // Show dismissible warning banner
  // "Il locale non esiste. Stai chattando in modalita generale."
  // User can still search for correct venue
}
```

This is already partially implemented in the current chat page (lines 245-299).

---

## 4. Technical Design

### 4.1 Data Flow Diagram

```
                            DATA FLOW
                            =========

    ┌──────────────────────────────────────────────────────────────────┐
    │                          QR SCAN                                  │
    │                             │                                     │
    │                             v                                     │
    │    ┌────────────────────────────────────────────────────────┐    │
    │    │              /v/[slug]/page.tsx                        │    │
    │    │              (Server Component)                        │    │
    │    │                                                        │    │
    │    │   1. Extract slug from params                          │    │
    │    │   2. Quick DB check: venue exists?                     │    │
    │    │   3. Redirect to /chat?venue=slug&from=qr              │    │
    │    │      OR /chat?venue_error=slug                         │    │
    │    └────────────────────────────────────────────────────────┘    │
    │                             │                                     │
    │                             v                                     │
    │    ┌────────────────────────────────────────────────────────┐    │
    │    │              /chat/page.tsx                            │    │
    │    │              (Client Component)                        │    │
    │    │                                                        │    │
    │    │   1. Parse URL params (venue, from, venue_error)       │    │
    │    │   2. If venue param:                                   │    │
    │    │      - loadVenue(slug) via useVenue hook               │    │
    │    │      - Store in session context (localStorage)         │    │
    │    │   3. If from=qr:                                       │    │
    │    │      - Show PWA smart banner (if applicable)           │    │
    │    │   4. If venue_error:                                   │    │
    │    │      - Show warning banner (existing logic)            │    │
    │    │   5. Clear URL params (router.replace)                 │    │
    │    │   6. Render chat UI                                    │    │
    │    └────────────────────────────────────────────────────────┘    │
    │                             │                                     │
    │                             v                                     │
    │    ┌────────────────────────────────────────────────────────┐    │
    │    │              Session Context                           │    │
    │    │              (Persisted in localStorage)               │    │
    │    │                                                        │    │
    │    │   - venueSlug: string | null                           │    │
    │    │   - venueData: Venue | null                            │    │
    │    │   - mode: 'general' | 'venue'                          │    │
    │    │   - messages: ChatMessage[]                            │    │
    │    └────────────────────────────────────────────────────────┘    │
    │                                                                   │
    └──────────────────────────────────────────────────────────────────┘
```

### 4.2 API Contract

No new API endpoints needed. Existing `/api/venue/[slug]` is sufficient.

**Optimization:** Add a lightweight venue existence check function.

```typescript
// lib/supabase.ts - Add this function
export async function checkVenueExists(slug: string): Promise<boolean> {
  const { count } = await supabase
    .from('venues')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  return (count ?? 0) > 0
}
```

### 4.3 Component Changes

#### 4.3.1 `/app/v/[slug]/page.tsx` - Convert to Server Component

**Current:** 215 lines, client component with full UI
**Proposed:** ~20 lines, server component with redirect

```typescript
// app/v/[slug]/page.tsx
import { redirect } from 'next/navigation'
import { checkVenueExists } from '@/lib/supabase'

interface VenuePageProps {
  params: Promise<{ slug: string }>
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params

  if (!slug) {
    redirect('/chat')
  }

  const exists = await checkVenueExists(slug)

  if (exists) {
    redirect(`/chat?venue=${encodeURIComponent(slug)}&from=qr`)
  } else {
    redirect(`/chat?venue_error=${encodeURIComponent(slug)}`)
  }
}
```

#### 4.3.2 `/app/chat/page.tsx` - Handle QR Source

Add handling for `from=qr` parameter.

**Changes needed (minimal):**
1. Parse `from` param in useEffect
2. If `from=qr`, trigger PWA smart banner logic
3. Existing venue loading logic remains unchanged

#### 4.3.3 New Component: `QrPwaBanner.tsx`

```typescript
// components/pwa/QrPwaBanner.tsx
interface QrPwaBannerProps {
  venueSlug: string | null
  showOnQr: boolean  // true when from=qr detected
}

export function QrPwaBanner({ venueSlug, showOnQr }: QrPwaBannerProps) {
  // Show only if:
  // 1. showOnQr is true
  // 2. PWA is installed (but we're in browser)
  // 3. Not already dismissed this session

  // On click:
  // 1. Store venueSlug in localStorage (pending venue)
  // 2. Attempt to open PWA
  // 3. Show manual instructions as fallback
}
```

### 4.4 Venue Persistence Logic

**Current session-context.tsx already handles most of this.** Key points:

1. **Session hydration:** On mount, loads from localStorage
2. **Session persistence:** On state change, saves to localStorage
3. **Session TTL:** 4 hours (SESSION_MAX_AGE_MS)
4. **Version check:** Clears incompatible sessions

**Addition needed:** Handle "pending venue" for PWA launch.

```typescript
// lib/session-storage.ts - Add these
export const PENDING_VENUE_KEY = 'wyn_pending_venue'

export function setPendingVenue(slug: string): void {
  setStorageItem(PENDING_VENUE_KEY, slug)
}

export function getPendingVenue(): string | null {
  const value = getStorageItem(PENDING_VENUE_KEY)
  removeStorageItem(PENDING_VENUE_KEY)  // Clear after reading
  return value
}
```

**In chat page initialization:**
```typescript
useEffect(() => {
  // Check for pending venue (from QR banner in browser)
  const pendingVenue = getPendingVenue()
  if (pendingVenue && !venueData) {
    loadVenue(pendingVenue)
  }
}, [])
```

---

## 5. Edge Cases

### 5.1 Invalid or Expired Venue Slug

**Scenario:** QR code from deactivated venue
**Handling:** Redirect to `/chat?venue_error=slug`, show warning banner

### 5.2 User Refreshes Chat Page

**Scenario:** User refreshes while in venue mode
**Handling:** Session context hydrates from localStorage, venue persists

### 5.3 Session Expired (>4 hours)

**Scenario:** User returns to tab after 4+ hours
**Handling:** Session cleared, user sees general chat mode

### 5.4 Multiple Venues in One Session

**Scenario:** User visits venue A, then scans QR at venue B
**Handling:**
- New venue replaces old in session context
- Both appear in recent venues list
- Conversation is NOT cleared (user might want to compare)

**Question for stakeholder:** Should we clear conversation when switching venues?

### 5.5 Private Browsing / Incognito

**Scenario:** User scans QR in incognito mode
**Handling:**
- localStorage may be blocked or cleared on close
- App still works, just no persistence
- Show subtle warning? (Non-goal for MVP)

### 5.6 Very Long Venue Slug

**Scenario:** Venue with 100+ character name
**Handling:** URL encoding handles this. UI truncation in headers.

---

## 6. Implementation Steps

### Phase 1: Server Redirect (1 hour)

**Files to modify:**
- `app/v/[slug]/page.tsx` - Convert to server component
- `lib/supabase.ts` - Add `checkVenueExists` function

**Checklist:**
- [ ] Create `checkVenueExists` in supabase.ts
- [ ] Rewrite `/v/[slug]/page.tsx` as server component
- [ ] Test redirect with valid slug
- [ ] Test redirect with invalid slug
- [ ] Test with special characters in slug

### Phase 2: Chat Page QR Handling (2 hours)

**Files to modify:**
- `app/chat/page.tsx` - Handle `from=qr` param

**Checklist:**
- [ ] Parse `from` param in URL effect
- [ ] Track QR source for PWA banner display
- [ ] Verify existing venue_error handling works
- [ ] Test full flow: QR scan to chat ready

### Phase 3: PWA Smart Banner (3 hours)

**Files to create:**
- `components/pwa/QrPwaBanner.tsx`
- `lib/session-storage.ts` - Add pending venue functions

**Files to modify:**
- `app/chat/page.tsx` - Integrate QrPwaBanner
- `components/pwa/index.ts` - Export new component

**Checklist:**
- [ ] Create QrPwaBanner component
- [ ] Add pending venue storage functions
- [ ] Integrate banner in chat page
- [ ] Handle pending venue on PWA launch
- [ ] Test in Safari with PWA installed
- [ ] Test in Chrome with PWA installed
- [ ] Graceful fallback when PWA launch fails

### Phase 4: Testing and Polish (2 hours)

**Checklist:**
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test PWA behavior
- [ ] Test with slow network
- [ ] Test localStorage full/blocked scenarios
- [ ] Performance: measure time from scan to chat ready
- [ ] Accessibility: keyboard navigation, screen readers

---

## 7. Test Strategy

### 7.1 Manual Testing Matrix

| Test Case | Safari iOS | Chrome Android | Desktop Chrome |
|-----------|------------|----------------|----------------|
| Valid venue QR scan | | | |
| Invalid venue QR scan | | | |
| PWA banner shows (PWA installed) | | | |
| PWA banner hidden (no PWA) | | | |
| Pending venue loads in PWA | | | |
| Session persists on refresh | | | |
| Session expires after 4h | | | |
| Private browsing mode | | | |

### 7.2 Automated Tests

**Unit tests (Vitest):**
- `checkVenueExists` returns correct boolean
- `setPendingVenue` / `getPendingVenue` storage functions
- URL parameter parsing logic

**E2E tests (Playwright):**
- Navigate to /v/valid-slug, verify redirect to /chat
- Navigate to /v/invalid-slug, verify error banner
- Refresh page, verify venue context persists

---

## 8. Rollback Plan

### 8.1 Immediate Rollback

If issues in production:
1. Revert `/v/[slug]/page.tsx` to previous version (with UI)
2. Remove `from=qr` param handling
3. Hide QrPwaBanner component

### 8.2 Feature Flag (Optional)

Could add `NEXT_PUBLIC_USE_QR_REDIRECT=true` env var to toggle behavior.
Not recommended for this scope - the feature is simple enough for full deploy.

---

## 9. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `lib/supabase.ts` | MODIFY | Add `checkVenueExists` function |
| `app/v/[slug]/page.tsx` | REPLACE | Convert to server redirect |
| `app/chat/page.tsx` | MODIFY | Handle `from=qr` param, integrate banner |
| `lib/session-storage.ts` | MODIFY | Add pending venue functions |
| `components/pwa/QrPwaBanner.tsx` | CREATE | Smart banner for PWA users |
| `components/pwa/index.ts` | MODIFY | Export new component |

---

## 10. Open Questions for Stakeholder

1. **Conversation clearing:** Should we clear the conversation when user switches to a different venue?
   - Current: Conversation persists
   - Alternative: Clear and start fresh

2. **PWA banner behavior:** How aggressive should we be about PWA promotion?
   - Option A: Show once per session from QR
   - Option B: Show every time from QR
   - Option C: Show only if user engaged (2+ messages)

3. **Landing page SEO:** The current landing page has venue info. Will removing it impact SEO?
   - The `/v/[slug]` page has minimal SEO value (private QR links)
   - Chat page could include meta tags with venue name

---

## 11. Review Criteria

- [ ] QR scan to chat ready in under 3 seconds
- [ ] Zero clicks required to start chatting
- [ ] Invalid venue shows clear error with options
- [ ] Venue persists across page refresh
- [ ] PWA users see smart banner from QR scan
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] Follows project conventions (CLAUDE.md)

---

## 12. Agent Assignments

| Phase | Agent | Estimated Time |
|-------|-------|----------------|
| 1. Server Redirect | Implementer BE/FE | 1 hour |
| 2. Chat Page QR Handling | Implementer FE | 2 hours |
| 3. PWA Smart Banner | Implementer FE | 3 hours |
| 4. Testing and Polish | Implementer FE + Reviewer | 2 hours |

**Total Estimated Time: 6-8 hours**

---

## Approval

- [ ] Architect review (this document)
- [ ] Stakeholder approval on open questions
- [ ] Ready for implementation
