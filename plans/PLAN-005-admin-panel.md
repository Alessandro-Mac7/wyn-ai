# PLAN-005: Admin Panel Implementation

## Status
- [x] Draft
- [ ] Under Review
- [ ] Approved
- [ ] In Progress
- [ ] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2025-01-02 |
| Type | feature |
| Priority | P1 |
| Dependencies | PLAN-002, PLAN-003 |

---

## 1. Summary

Implement the admin panel for venue owners to manage their wine list. Includes authentication, wine CRUD operations, and availability toggling. UI follows mockups in `mockup/` folder.

---

## 2. Goals

- Simple authentication (email/password, MVP)
- Wine list management (add, edit, delete, toggle)
- Filter wines by type
- Search wines by name
- Responsive admin dashboard

---

## 3. Non-Goals

- Multi-user per venue (one admin per venue for MVP)
- Role-based permissions (future)
- Bulk import/export (future)
- Analytics dashboard (future)

---

## 4. Affected Areas

| Area | Impact |
|------|--------|
| `app/api/admin/login/route.ts` | Auth endpoint |
| `app/api/admin/wines/route.ts` | Wine CRUD endpoints |
| `app/admin/page.tsx` | Login page |
| `app/admin/dashboard/page.tsx` | Wine management |
| `components/admin/*` | Admin UI components |
| `hooks/useAdmin.ts` | Admin state management |
| `lib/auth.ts` | Auth utilities |

---

## 5. Technical Design

### 5.1 Authentication

**Simple JWT-based auth for MVP:**

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wyn-secret-key-change-in-production'
)

export interface AdminToken {
  venue_id: string
  venue_slug: string
  venue_name: string
  exp: number
}

export async function createToken(venue: {
  id: string
  slug: string
  name: string
}): Promise<string> {
  return new SignJWT({
    venue_id: venue.id,
    venue_slug: venue.slug,
    venue_name: venue.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AdminToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AdminToken
  } catch {
    return null
  }
}
```

### 5.2 API Endpoints

**POST `/api/admin/login`**

```typescript
// Request
interface LoginRequest {
  email: string
  password: string
}

// Response (200)
interface LoginResponse {
  token: string
  venue: {
    id: string
    slug: string
    name: string
  }
}

// Response (401)
{ error: 'Invalid credentials' }
```

**Implementation:**

```typescript
// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyVenueCredentials } from '@/lib/supabase'
import { createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const venue = await verifyVenueCredentials(email, password)

    if (!venue) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = await createToken({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
    })

    return NextResponse.json({
      token,
      venue: {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

**GET `/api/admin/wines`**

```typescript
// Headers: Authorization: Bearer <token>

// Response (200)
interface WinesResponse {
  wines: WineWithRatings[]
  venue: { id: string; name: string }
}
```

**POST `/api/admin/wines`**

```typescript
// Request
interface CreateWineRequest {
  name: string
  wine_type: WineType
  price: number
  price_glass?: number
  producer?: string
  region?: string
  denomination?: string
  grape_varieties?: string[]
  year?: number
  description?: string
}

// Response (201)
{ wine: Wine }
```

**PATCH `/api/admin/wines`**

```typescript
// Request
interface UpdateWineRequest {
  wine_id: string
  updates: Partial<Wine>
}

// Response (200)
{ wine: Wine }
```

**DELETE `/api/admin/wines`**

```typescript
// Request
{ wine_id: string }

// Response (200)
{ deleted: true }
```

**Implementation:**

```typescript
// app/api/admin/wines/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import {
  getWinesWithRatings,
  createWine,
  updateWine,
  deleteWine,
} from '@/lib/supabase'

// Middleware to verify auth
async function getAuthVenue(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  const auth = await getAuthVenue(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const wines = await getWinesWithRatings(auth.venue_id, false)

  return NextResponse.json({
    wines,
    venue: { id: auth.venue_id, name: auth.venue_name },
  })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthVenue(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validate required fields
  if (!body.name || !body.wine_type || !body.price) {
    return NextResponse.json(
      { error: 'Name, type, and price are required' },
      { status: 400 }
    )
  }

  const wine = await createWine(auth.venue_id, body)

  if (!wine) {
    return NextResponse.json(
      { error: 'Failed to create wine' },
      { status: 500 }
    )
  }

  return NextResponse.json({ wine }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthVenue(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { wine_id, updates } = await request.json()

  if (!wine_id) {
    return NextResponse.json(
      { error: 'Wine ID required' },
      { status: 400 }
    )
  }

  const wine = await updateWine(wine_id, updates)

  if (!wine) {
    return NextResponse.json(
      { error: 'Failed to update wine' },
      { status: 500 }
    )
  }

  return NextResponse.json({ wine })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthVenue(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { wine_id } = await request.json()

  if (!wine_id) {
    return NextResponse.json(
      { error: 'Wine ID required' },
      { status: 400 }
    )
  }

  const success = await deleteWine(wine_id)

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to delete wine' },
      { status: 500 }
    )
  }

  return NextResponse.json({ deleted: true })
}
```

### 5.3 Admin Hook

```typescript
// hooks/useAdmin.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WineWithRatings, WineCreateInput } from '@/types'

interface AdminState {
  isAuthenticated: boolean
  token: string | null
  venue: { id: string; name: string; slug: string } | null
  wines: WineWithRatings[]
  isLoading: boolean
  error: string | null
}

export function useAdmin() {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    token: null,
    venue: null,
    wines: [],
    isLoading: true,
    error: null,
  })

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('wyn_admin_token')
    const venue = localStorage.getItem('wyn_admin_venue')

    if (token && venue) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        token,
        venue: JSON.parse(venue),
        isLoading: false,
      }))
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      const { token, venue } = await res.json()

      localStorage.setItem('wyn_admin_token', token)
      localStorage.setItem('wyn_admin_venue', JSON.stringify(venue))

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        token,
        venue,
        isLoading: false,
      }))

      return true
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('wyn_admin_token')
    localStorage.removeItem('wyn_admin_venue')
    setState({
      isAuthenticated: false,
      token: null,
      venue: null,
      wines: [],
      isLoading: false,
      error: null,
    })
  }, [])

  const fetchWines = useCallback(async () => {
    if (!state.token) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const res = await fetch('/api/admin/wines', {
        headers: { Authorization: `Bearer ${state.token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch wines')

      const { wines } = await res.json()
      setState(prev => ({ ...prev, wines, isLoading: false }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load wines',
        isLoading: false,
      }))
    }
  }, [state.token])

  const addWine = useCallback(async (input: WineCreateInput) => {
    if (!state.token) return null

    const res = await fetch('/api/admin/wines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) return null

    const { wine } = await res.json()
    setState(prev => ({
      ...prev,
      wines: [...prev.wines, { ...wine, ratings: [] }],
    }))
    return wine
  }, [state.token])

  const updateWine = useCallback(async (wineId: string, updates: Partial<WineCreateInput>) => {
    if (!state.token) return false

    const res = await fetch('/api/admin/wines', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ wine_id: wineId, updates }),
    })

    if (!res.ok) return false

    const { wine } = await res.json()
    setState(prev => ({
      ...prev,
      wines: prev.wines.map(w => w.id === wineId ? { ...w, ...wine } : w),
    }))
    return true
  }, [state.token])

  const toggleAvailability = useCallback(async (wineId: string, available: boolean) => {
    return updateWine(wineId, { available } as any)
  }, [updateWine])

  const removeWine = useCallback(async (wineId: string) => {
    if (!state.token) return false

    const res = await fetch('/api/admin/wines', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ wine_id: wineId }),
    })

    if (!res.ok) return false

    setState(prev => ({
      ...prev,
      wines: prev.wines.filter(w => w.id !== wineId),
    }))
    return true
  }, [state.token])

  return {
    ...state,
    login,
    logout,
    fetchWines,
    addWine,
    updateWine,
    toggleAvailability,
    removeWine,
  }
}
```

### 5.4 Admin Components

**Component Structure (following mockups):**

```
components/admin/
├── LoginForm.tsx       # Login card (admin-login.png)
├── WineCard.tsx        # Wine display card (admin-paanel.png)
├── WineFilters.tsx     # Type filter tabs
├── WineSearch.tsx      # Search input
├── WineModal.tsx       # Add/Edit modal (add-new-wine.png)
└── AdminHeader.tsx     # Header with nav
```

**See mockup references:**
- `mockup/admin-login.png` - Login form design
- `mockup/admin-paanel.png` - Dashboard with wine cards
- `mockup/add-new-wine.png` - Wine form modal

### 5.5 Page Implementations

**Login Page (`app/admin/page.tsx`):**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { LoginForm } from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, login, error } = useAdmin()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <LoginForm onSubmit={login} error={error} />
    </main>
  )
}
```

**Dashboard Page (`app/admin/dashboard/page.tsx`):**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { WineCard } from '@/components/admin/WineCard'
import { WineFilters } from '@/components/admin/WineFilters'
import { WineSearch } from '@/components/admin/WineSearch'
import { WineModal } from '@/components/admin/WineModal'
import type { WineType } from '@/types'

export default function AdminDashboardPage() {
  const router = useRouter()
  const {
    isAuthenticated,
    isLoading,
    venue,
    wines,
    fetchWines,
    addWine,
    toggleAvailability,
    removeWine,
    logout,
  } = useAdmin()

  const [filter, setFilter] = useState<WineType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWines()
    }
  }, [isAuthenticated, fetchWines])

  const filteredWines = wines.filter(wine => {
    const matchesType = filter === 'all' || wine.wine_type === filter
    const matchesSearch = wine.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <AdminHeader venueName={venue?.name} onLogout={logout} />

      <main className="max-w-7xl mx-auto p-4">
        {/* Title and Add button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestione Vini</h1>
            <p className="text-muted-foreground">
              {venue?.name} • {wines.length} vini
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            + Aggiungi Vino
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <WineSearch value={search} onChange={setSearch} />
          <WineFilters selected={filter} onChange={setFilter} />
        </div>

        {/* Wine Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWines.map(wine => (
            <WineCard
              key={wine.id}
              wine={wine}
              onToggle={(available) => toggleAvailability(wine.id, available)}
              onDelete={() => removeWine(wine.id)}
            />
          ))}
        </div>

        {filteredWines.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nessun vino trovato
          </p>
        )}
      </main>

      {/* Add Wine Modal */}
      {showModal && (
        <WineModal
          onClose={() => setShowModal(false)}
          onSave={async (input) => {
            await addWine(input)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
```

---

## 6. Implementation Steps

### Backend (AGENT_IMPLEMENTER_BE)
1. [ ] Create `lib/auth.ts` with JWT functions
2. [ ] Implement `app/api/admin/login/route.ts`
3. [ ] Implement `app/api/admin/wines/route.ts` (GET, POST, PATCH, DELETE)
4. [ ] Add `jose` package for JWT
5. [ ] Test all endpoints with curl

### Frontend (AGENT_IMPLEMENTER_FE)
6. [ ] Create `hooks/useAdmin.ts`
7. [ ] Create `components/admin/LoginForm.tsx`
8. [ ] Create `components/admin/AdminHeader.tsx`
9. [ ] Create `components/admin/WineCard.tsx`
10. [ ] Create `components/admin/WineFilters.tsx`
11. [ ] Create `components/admin/WineSearch.tsx`
12. [ ] Create `components/admin/WineModal.tsx`
13. [ ] Update `app/admin/page.tsx`
14. [ ] Update `app/admin/dashboard/page.tsx`
15. [ ] Apply mockup styling (PLAN-007)

---

## 7. Test Strategy

- **Auth Test:** Login, invalid credentials, token expiry
- **CRUD Test:** Create, read, update, delete wines
- **UI Test:** Form validation, loading states, error handling
- **E2E:** Full login → add wine → toggle → logout flow

---

## 8. Rollback Plan

1. Revert all admin-related files
2. No database schema changes
3. Clear localStorage tokens on rollback

---

## 9. Review Checklist

- [ ] Login works with demo credentials
- [ ] Token stored securely in localStorage
- [ ] All CRUD operations work
- [ ] Availability toggle updates immediately
- [ ] Wine modal validates required fields
- [ ] Filters and search work correctly
- [ ] UI matches mockups

---

**This plan provides venue management capabilities.**
