# CLAUDE.md - WYN Project Reference
## Single Source of Truth for All Agents

> **IMPORTANT:** All agents MUST read this file before any action.
> This document defines architecture, conventions, and rules that apply globally.

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Name** | WYN |
| **Type** | AI Sommelier Platform |
| **Stack** | Next.js 14 + TypeScript + Supabase + Tailwind |
| **Target** | Italian restaurants (MVP) |
| **Philosophy** | Simplicity, Accuracy, Incrementality |

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WYN ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      NEXT.JS 14 APP                           │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │                    APP ROUTER                            │ │   │
│  │  │                                                          │ │   │
│  │  │  PAGES                           API ROUTES              │ │   │
│  │  │  ├── /              (landing)    ├── /api/chat          │ │   │
│  │  │  ├── /chat          (general)    ├── /api/admin/login   │ │   │
│  │  │  ├── /v/[slug]      (venue)      ├── /api/admin/wines   │ │   │
│  │  │  └── /admin/*       (dashboard)  └── /api/enrichment    │ │   │
│  │  │                                                          │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │                    LIB LAYER                             │ │   │
│  │  │  supabase.ts │ llm.ts │ prompts.ts │ enrichment.ts      │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│              ┌───────────────┼───────────────┐                      │
│              ▼               ▼               ▼                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │   SUPABASE    │  │   LLM APIs    │  │  WEB SPEECH   │           │
│  │  (PostgreSQL) │  │ Groq / Claude │  │     API       │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1 Deployment Model

| Component | Platform | Tier |
|-----------|----------|------|
| Frontend + API | Vercel | Free |
| Database | Supabase | Free |
| LLM (dev) | Groq | Free |
| LLM (prod) | Anthropic | Pay-per-use |

### 2.2 Data Flow

```
Customer Journey:
QR Code → /v/[slug] → Load venue wines → Chat with AI → Get recommendations

Venue Admin Journey:
/admin → Login (Supabase Auth) → /admin/dashboard → Add/Toggle wines → AI Enrichment (async)

Super Admin Journey:
/admin → Login (Supabase Auth) → /internal/venues → Censimento nuovi locali
```

---

## 3. DOMAIN MODEL

### 3.1 Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOMAIN CONTEXTS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   VENUE CTX     │  │    WINE CTX     │  │    CHAT CTX     │     │
│  │                 │  │                 │  │                 │     │
│  │  • Venue        │  │  • Wine         │  │  • Message      │     │
│  │  • VenueAuth    │  │  • WineType     │  │  • Conversation │     │
│  │  • Slug         │  │  • Enrichment   │  │  • Context      │     │
│  │                 │  │  • Rating       │  │                 │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                     │
│                    ┌───────────┴───────────┐                        │
│                    │   RECOMMENDATION CTX  │                        │
│                    │                       │                        │
│                    │  • WineGuide          │                        │
│                    │  • SommelierPrompt    │                        │
│                    │  • FoodPairing        │                        │
│                    └───────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Venue** | Restaurant/bar using WYN | id, slug, name, description |
| **Wine** | Wine in venue's list | id, venue_id, name, type, price, available |
| **WineEnriched** | Wine with AI data | grape_varieties, tasting_notes, ratings |
| **Message** | Chat message | id, role, content, timestamp |
| **WineGuide** | Rating publication | id, name, ratingSystem, philosophy |

### 3.3 Invariants (Business Rules)

```
RULE-001: In-venue chat ONLY recommends wines with available=true
RULE-002: AI NEVER invents wines not in venue's list
RULE-003: AI ALWAYS mentions prices in venue mode
RULE-004: AI NEVER mentions prices in general mode
RULE-005: Enrichment failure does NOT block wine availability
RULE-006: Ratings with confidence < 0.4 are discarded
RULE-007: One admin account per venue (MVP)
```

---

## 4. TECHNOLOGY DECISIONS

### 4.1 Stack Rationale

| Technology | Why Chosen | Alternative Considered |
|------------|------------|------------------------|
| Next.js 14 | Unified FE+BE, Vercel deploy | Express + React (more complexity) |
| Supabase | Free PostgreSQL, easy setup | Firebase (less SQL-friendly) |
| Tailwind | Fast styling, consistent design | CSS Modules (slower) |
| shadcn/ui | Accessible, customizable | MUI (heavier) |
| Groq | Free, fast, good quality | OpenAI (expensive for dev) |
| Web Speech API | Native, free | Whisper API (cost, latency) |

### 4.2 Architectural Decisions Record (ADR)

| ID | Decision | Status |
|----|----------|--------|
| ADR-001 | No vector DB for MVP (wines fit in context) | ✅ Accepted |
| ADR-002 | JSONB for ratings (flexible schema) | ✅ Accepted |
| ADR-003 | Async enrichment (non-blocking UX) | ✅ Accepted |
| ADR-004 | Supabase Auth with RLS and two-tier roles | ✅ Implemented |
| ADR-005 | Configurable wine guides system | ✅ Accepted |
| ADR-006 | Italian-only UI for MVP | ✅ Accepted |

---

## 5. PROJECT STRUCTURE

```
wyn/
├── CLAUDE.md                    # THIS FILE - Source of truth
├── mockup/                      # UI/UX Design Reference (MUST follow)
│   ├── home.png                 # Home/Chat page design
│   ├── about.png                # "Scopri WYN" feature page
│   ├── admin-login.png          # Admin authentication
│   ├── admin-paanel.png         # Wine management dashboard
│   └── add-new-wine.png         # Wine creation modal
├── plans/                       # Change plans (explore→plan→implement→review)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_auth_migration.sql  # Supabase Auth + RLS policies
├── app/                         # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── chat/
│   ├── v/[slug]/
│   ├── admin/
│   │   ├── page.tsx             # Login page
│   │   └── dashboard/
│   │       └── page.tsx         # Venue admin dashboard
│   ├── internal/
│   │   └── venues/
│   │       └── page.tsx         # Super admin - venue registration
│   └── api/
│       ├── chat/
│       ├── enrichment/
│       └── internal/
│           └── venues/
│               └── route.ts     # Super admin API
├── components/
│   ├── chat/
│   ├── admin/
│   ├── ui/
│   └── Providers.tsx            # AuthProvider wrapper
├── contexts/
│   ├── auth-context.tsx         # Supabase Auth context
│   └── session-context.tsx      # Chat session context
├── hooks/
│   └── useAdmin.ts              # Admin dashboard hook (self-contained auth)
├── lib/
│   ├── supabase.ts              # Legacy Supabase client
│   ├── supabase-auth.ts         # Browser client for auth
│   ├── supabase-auth-server.ts  # Server client + admin functions
│   ├── llm.ts
│   ├── prompts.ts
│   └── enrichment.ts
├── middleware.ts                # Route protection (auth + role checks)
├── config/
├── types/
└── public/
```

---

## 6. CODE CONVENTIONS

### 6.1 TypeScript

```typescript
// ✅ DO: Use strict types
interface Wine {
  id: string
  name: string
  wine_type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'
  price: number
}

// ❌ DON'T: Use any
interface Wine {
  id: any  // NEVER
}

// ✅ DO: Export types from types/index.ts
// ✅ DO: Use interfaces for objects, types for unions
// ✅ DO: Prefer readonly where applicable
```

### 6.2 Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files | kebab-case | `wine-card.tsx` |
| Components | PascalCase | `WineCard` |
| Functions | camelCase | `formatWineList` |
| Types/Interfaces | PascalCase | `WineEnriched` |
| Constants | UPPER_SNAKE | `SYSTEM_PROMPT` |
| Database columns | snake_case | `wine_type` |
| API routes | kebab-case | `/api/admin/wines` |

### 6.3 Component Pattern

```typescript
// components/example/ExampleComponent.tsx
'use client'  // Only if uses hooks/browser APIs

import { useState } from 'react'
import { ExampleProps } from '@/types'

interface ExampleComponentProps {
  // Props here
}

export function ExampleComponent({ }: ExampleComponentProps) {
  // State
  // Effects
  // Handlers
  // Return JSX
}
```

### 6.4 API Route Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      )
    }
    
    // Process
    const result = await processData(body)
    
    // Return
    return NextResponse.json({ data: result })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 6.5 Error Handling

```typescript
// ✅ DO: Catch and handle errors gracefully
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Context:', error)
  // Return safe default or throw with context
}

// ✅ DO: Use error boundaries in React
// ✅ DO: Log errors with context
// ✅ DO: Return user-friendly error messages
// ❌ DON'T: Swallow errors silently
// ❌ DON'T: Expose internal error details to users
```

### 6.6 Imports Order

```typescript
// 1. React/Next
import { useState, useEffect } from 'react'
import { NextRequest } from 'next/server'

// 2. External libraries
import { createClient } from '@supabase/supabase-js'

// 3. Internal absolute imports
import { Wine } from '@/types'
import { supabase } from '@/lib/supabase'

// 4. Relative imports
import { ChildComponent } from './ChildComponent'
```

---

## 7. TESTING STRATEGY

### 7.1 Test Types

| Type | Tool | Location | Coverage Target |
|------|------|----------|-----------------|
| Unit | Vitest | `*.test.ts` next to file | Lib functions: 80% |
| Component | Testing Library | `*.test.tsx` | Critical components |
| E2E | Playwright | `e2e/` | Happy paths |
| API | Vitest | `*.test.ts` | All endpoints |

### 7.2 Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### 7.3 Test Conventions

```typescript
// ✅ DO: Descriptive test names
describe('formatWineList', () => {
  it('should group wines by type', () => {})
  it('should exclude unavailable wines', () => {})
  it('should return empty string for empty list', () => {})
})

// ✅ DO: Test edge cases
// ✅ DO: Mock external services
// ✅ DO: Use factories for test data
// ❌ DON'T: Test implementation details
// ❌ DON'T: Write flaky tests
```

---

## 8. GIT CONVENTIONS

### 8.1 Commit Messages

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes nor adds
- `docs`: Documentation
- `style`: Formatting
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(chat): add voice input support
fix(admin): resolve wine toggle not persisting
refactor(lib): extract LLM client to separate module
docs(readme): add deployment instructions
```

### 8.2 Branch Strategy

```
main                    # Production-ready
├── develop             # Integration branch
│   ├── feature/xxx     # New features
│   ├── fix/xxx         # Bug fixes
│   └── refactor/xxx    # Refactoring
```

### 8.3 PR Requirements

- [ ] Linked to plan in `plans/`
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Reviewed by AGENT_REVIEWER
- [ ] Documentation updated if needed

---

## 9. ENVIRONMENT VARIABLES

### 9.1 Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only, for admin operations

# LLM
GROQ_API_KEY=gsk_xxx...
ANTHROPIC_API_KEY=sk-ant-xxx...  # Production

# App
NEXT_PUBLIC_APP_NAME=WYN
```

### 9.2 Environment Files

| File | Purpose | Git |
|------|---------|-----|
| `.env.local` | Local development | ❌ Ignored |
| `.env.example` | Template | ✅ Committed |
| Vercel Dashboard | Production | N/A |

---

## 10. CI/CD PIPELINE

### 10.1 GitHub Actions (Future)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
```

### 10.2 Vercel Integration

- Auto-deploy on push to `main`
- Preview deploys on PRs
- Environment variables in Vercel dashboard

---

## 11. SECURITY GUIDELINES

### 11.1 Rules

| Rule | Implementation |
|------|----------------|
| No secrets in code | Use env variables |
| Validate all inputs | Check in API routes |
| Sanitize LLM outputs | Strip dangerous content |
| Auth on protected routes | Middleware check |
| HTTPS only | Vercel handles |

### 11.2 Authentication System (Supabase Auth)

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   SUPER ADMIN       │    │   VENUE ADMIN       │            │
│  │   (Piattaforma)     │    │   (Ristoratore)     │            │
│  │                     │    │                     │            │
│  │  • Censisce locali  │    │  • Gestisce vini    │            │
│  │  • /internal/*      │    │  • /admin/dashboard │            │
│  └─────────────────────┘    └─────────────────────┘            │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      ▼                                          │
│         ┌─────────────────────────┐                            │
│         │    Supabase Auth        │                            │
│         │  (auth.users table)     │                            │
│         └─────────────────────────┘                            │
│                      │                                          │
│           ┌─────────┴─────────┐                                │
│           ▼                   ▼                                │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   user_roles    │  │     venues      │                     │
│  │ (super_admin/   │  │  (owner_id →    │                     │
│  │  venue_admin)   │  │   auth.users)   │                     │
│  └─────────────────┘  └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Key Files:
- lib/supabase-auth.ts         → Browser client
- lib/supabase-auth-server.ts  → Server client + admin operations
- middleware.ts                → Route protection
- hooks/useAdmin.ts            → Dashboard auth (self-contained)

RLS Policies:
- venues: read public, write owner/super_admin
- wines: read public, write venue owner/super_admin
- user_roles: read own, write service_role only
```

---

## 12. PERFORMANCE GUIDELINES

### 12.1 Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| API Response | < 500ms (excluding LLM) |
| LLM Response | < 5s |

### 12.2 Optimizations

- Server components by default
- Client components only when needed
- Lazy load heavy components
- Optimize images with next/image
- Cache LLM responses where possible

---

## 13. AGENT INTERACTION RULES

### 13.1 Mandatory Workflow

```
EXPLORE → PLAN → IMPLEMENT → REVIEW → DEPLOY
```

### 13.2 Agent Responsibilities

| Agent | Does | Does NOT |
|-------|------|----------|
| Architect | Plans, designs | Write code |
| Prompt Engineer | AI prompts, anti-hallucination | Implementation code |
| Implementer BE | Backend code | Change architecture |
| Implementer FE | Frontend code | Change API contracts |
| Reviewer | Validate, check | Write new code |
| Ops | Deploy, monitor | Business logic |

### 13.3 Communication Protocol

1. All agents read `CLAUDE.md` first
2. Architects produce plans in `plans/`
3. Implementers follow approved plans
4. Reviewers validate against plans
5. Ops deploys after approval

---

## 14. UI/UX DESIGN REFERENCE

> **CRITICAL:** All frontend implementation MUST follow the mockups in `mockup/` folder.

### 14.1 Mockup Files

| Page | File | Key Elements |
|------|------|--------------|
| Home/Chat | `mockup/home.png` | Sidebar nav, chat input, mode toggle, suggestion chips |
| About | `mockup/about.png` | Feature cards (Sommelier AI, Al Ristorante, Recensioni) |
| Admin Login | `mockup/admin-login.png` | Dark card, email/password fields, wine-red button |
| Admin Panel | `mockup/admin-paanel.png` | Wine cards with badges, filters, search, toggles |
| Add Wine | `mockup/add-new-wine.png` | Modal form with all wine fields |

### 14.2 Design System

| Element | Specification |
|---------|---------------|
| Theme | Dark mode only (MVP) |
| Primary BG | `#1a1a1a` |
| Card BG | `#242424` |
| Accent Color | Wine red `#8b2942` |
| Text Primary | `#ffffff` |
| Text Secondary | `#a0a0a0` |
| Font | Inter |

### 14.3 Component Patterns

- **Wine Type Badges:** Rosso (red), Bianco (amber), Spumante (purple)
- **Rating Badges:** Star icon + score in outlined pill
- **Toggles:** Green when available, gray when disabled
- **Buttons:** Wine-red for primary actions, ghost for secondary
- **Inputs:** Dark background with subtle borders, icon prefixes

### 14.4 FE Implementation Plan

See `plans/PLAN-007-frontend-ui-implementation.md` for detailed implementation steps.

---

## 15. QUICK REFERENCE

### 15.1 Key Files

| Purpose | Location |
|---------|----------|
| Types | `types/index.ts` |
| DB Client (legacy) | `lib/supabase.ts` |
| Auth Client (browser) | `lib/supabase-auth.ts` |
| Auth Client (server) | `lib/supabase-auth-server.ts` |
| Route Protection | `middleware.ts` |
| Admin Hook | `hooks/useAdmin.ts` |
| LLM Client | `lib/llm.ts` |
| AI Prompts | `lib/prompts.ts` |
| Enrichment | `lib/enrichment.ts` |
| Wine Guides | `config/wine-guides.config.ts` |
| Auth Migration | `supabase/migrations/002_auth_migration.sql` |
| UI Mockups | `mockup/*.png` |

### 15.2 Common Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # TypeScript check
```

### 15.3 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

## DOCUMENT VERSION

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-30 | Initial | Baseline |
| 1.1.0 | 2025-01-05 | Claude | Supabase Auth migration, two-tier roles, RLS policies |

---

**This is the authoritative reference. When in doubt, check here first.**
