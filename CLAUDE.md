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
┌──────────────────────────────────────────────────────────────────────┐
│                     WYN ARCHITECTURE v2                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  NEXT.JS 14 APP                                                       │
│  ├── Pages: /, /chat, /v/[slug], /scan, /admin/*, /internal/*        │
│  ├── API:   /api/chat (RAG-aware), /api/scan-label, /api/embeddings  │
│  │          /api/venues/discover, /api/cron/memory-decay              │
│  └── Lib:   llm.ts, prompts.ts, rag.ts, embeddings.ts,              │
│             memory.ts, wine-knowledge.ts, vision.ts                   │
│                                                                       │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  SUPABASE        │  │  LLM APIs       │  │  EMBEDDING API   │    │
│  │  PostgreSQL      │  │  Groq / Claude  │  │  OpenAI          │    │
│  │  + pgvector      │  │  / GPT-4o-mini  │  │  3-small (1536d) │    │
│  └──────┬───────────┘  └─────────────────┘  └──────────────────┘    │
│         │                                                             │
│  TABLES:                                                              │
│  ├── venues, wines, wine_ratings      (core)                         │
│  ├── wine_embeddings (vector 1536)    (RAG - Phase 1)                │
│  ├── wine_knowledge                   (deep knowledge - Phase 2)     │
│  ├── memory_fragments (vector 1536)   (user memory - Phase 3)        │
│  └── user_profiles, chat_sessions     (auth + sessions)              │
│                                                                       │
│  KEY FUNCTIONS (PostgreSQL):                                          │
│  ├── match_wines()          → hybrid vector + SQL search              │
│  ├── match_memories()       → weight-adjusted memory search           │
│  └── decay_memory_weights() → stale memory management                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.1 Deployment Model

| Component | Platform | Tier |
|-----------|----------|------|
| Frontend + API | Vercel | Free |
| Database + pgvector | Supabase | Free |
| LLM (dev) | Groq | Free |
| LLM (prod) | Anthropic | Pay-per-use |
| Embeddings | OpenAI text-embedding-3-small | Pay-per-use (~$0.02/1M tokens) |

### 2.2 Data Flow

```
Customer Journey (Venue Mode):
QR Code → /v/[slug] → Load venue wines → Chat with AI → Get recommendations
  └── If >50 wines: RAG path (embed query → match_wines → top 8 in prompt)
  └── If <=50 wines: Full context (all wines in prompt)

Customer Journey (General Mode):
/chat → Ask wine questions → AI responds → Label scan / Venue discovery CTAs
  └── Memory: preferences extracted post-session, injected in next chat
  └── Label scan: camera icon → /api/scan-label → wine info as chat message
  └── CTAs: every 3rd message, guide to venue mode

Venue Admin Journey:
/admin → Login → /admin/dashboard → Add/Toggle wines → AI Enrichment (async)
  └── Enrichment → Knowledge generation → Embedding pipeline → wine_embeddings

Super Admin Journey:
/admin → Login → /internal/venues → Censimento nuovi locali
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
│  │                 │  │  • Rating       │  │  • Memory       │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                     │
│  ┌─────────────────┐  ┌───────┴───────────┐  ┌─────────────────┐   │
│  │  EMBEDDING CTX  │  │ RECOMMENDATION CTX│  │   MEMORY CTX    │   │
│  │                 │  │                   │  │                 │   │
│  │  • WineEmbedding│  │  • WineGuide     │  │  • Fragment     │   │
│  │  • RAG Search   │  │  • SommelierPrompt│  │  • Extraction  │   │
│  │  • Query Intent │  │  • FoodPairing   │  │  • Decay        │   │
│  │  • Knowledge    │  │  • VenueDiscovery│  │  • GDPR         │   │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Venue** | Restaurant/bar using WYN | id, slug, name, description, latitude, longitude |
| **Wine** | Wine in venue's list | id, venue_id, name, type, price, available |
| **WineEnriched** | Wine with AI data | grape_varieties, tasting_notes, ratings |
| **WineEmbedding** | Vector representation | wine_id, venue_id, embedding(1536), content_hash |
| **WineKnowledge** | Deep sommelier knowledge | wine_id, producer_history, terroir, pairings, curiosities |
| **MemoryFragment** | User preference/memory | user_id, fragment_type, content, embedding, weight |
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
RULE-008: Venues with >50 wines use RAG search; <=50 use full context
RULE-009: Memory extraction requires authenticated user with profiling_consent=true
RULE-010: Memory fragments decay 5%/month weight when not accessed for 30 days
RULE-013: Deep knowledge generation uses best available model for accuracy
RULE-014: General mode has NO rate limit - it's the vertical app core
RULE-015: General mode responses include contextual CTA toward venue mode
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
| ADR-001 | pgvector for venues >50 wines; full context for <=50 | ✅ Implemented (replaces "no vector DB") |
| ADR-002 | JSONB for ratings (flexible schema) | ✅ Accepted |
| ADR-003 | Async enrichment (non-blocking UX) | ✅ Accepted |
| ADR-004 | Supabase Auth with RLS and two-tier roles | ✅ Implemented |
| ADR-005 | Configurable wine guides system | ✅ Accepted |
| ADR-006 | Italian-only UI for MVP | ✅ Accepted |
| ADR-007 | OpenAI text-embedding-3-small for embeddings (1536d, cheap) | ✅ Implemented |
| ADR-008 | Content hash to skip unchanged re-embeddings | ✅ Implemented |
| ADR-009 | User memories are user-scoped, not venue-scoped (cross-venue) | ✅ Implemented |
| ADR-010 | Memory decay via cron, min weight 0.1 (never fully forgotten) | ✅ Implemented |
| ADR-011 | CTAs are pure UI, zero LLM token cost | ✅ Implemented |

---

## 5. PROJECT STRUCTURE

```
wyn/
├── CLAUDE.md                    # THIS FILE - Source of truth
├── docs/
│   └── ARCHITECTURE-RAG-MEMORY.md  # Technical reference for RAG/Memory systems
├── mockup/                      # UI/UX Design Reference (MUST follow)
├── plans/
│   ├── PLAN-PLATFORM-EVOLUTION-V2.md   # Main evolution plan (Phases 1-5)
│   └── PLAN-WIDGET-API-SDK.md          # Deferred: widget + public API
├── supabase/
│   └── migrations/
│       ├── 001_add_recommended_column.sql
│       ├── 002_auth_migration.sql       # Supabase Auth + RLS
│       ├── 003_venue_location.sql       # Venue geolocation
│       ├── 004_app_settings.sql
│       ├── 005_user_profiles.sql        # User profiles + consent
│       ├── 006_fix_user_profile_trigger.sql
│       ├── 007_pgvector_wine_embeddings.sql  # pgvector + match_wines()
│       ├── 008_wine_knowledge.sql            # Deep wine knowledge
│       └── 009_memory_fragments.sql          # Memory + match_memories() + decay
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── chat/page.tsx            # Main chat (general + venue, label scan, CTAs)
│   ├── scan/page.tsx            # Standalone label scanner
│   ├── v/[slug]/page.tsx        # Venue entry via QR
│   ├── admin/
│   │   ├── page.tsx             # Login
│   │   └── dashboard/page.tsx   # Venue admin dashboard
│   ├── internal/venues/page.tsx # Super admin
│   └── api/
│       ├── chat/route.ts             # RAG-aware chat (RULE-008)
│       ├── scan-label/route.ts       # Vision API label scan
│       ├── enrichment/route.ts       # Wine AI enrichment
│       ├── embeddings/               # Embedding pipeline APIs
│       │   ├── route.ts              # Batch embed
│       │   ├── sync/route.ts         # Single wine sync
│       │   └── backfill/route.ts     # Backfill existing wines
│       ├── venues/
│       │   ├── nearby/route.ts       # Haversine nearby search
│       │   └── discover/route.ts     # Cross-venue wine discovery (RAG)
│       ├── admin/wines/[wineId]/knowledge/route.ts  # Knowledge review
│       ├── chat-session/analyze/route.ts  # Memory extraction post-session
│       ├── cron/memory-decay/route.ts     # Weekly memory weight decay
│       ├── user/
│       │   ├── memories/route.ts     # GDPR: list/delete memories
│       │   └── export/route.ts       # GDPR: data export (includes memories)
│       └── internal/venues/route.ts
├── components/
│   ├── chat/
│   │   ├── ChatMessage.tsx       # Message + contextual CTAs
│   │   ├── ChatMessages.tsx      # Message list + CTA logic
│   │   ├── ChatInput.tsx         # Input with ImageAttachment
│   │   ├── ChatContainer.tsx     # Alternative chat wrapper with scan
│   │   ├── VenueDiscoveryCard.tsx  # Nearby venues with matching wines
│   │   ├── VenueSelector.tsx     # Venue search/select modal
│   │   └── ...
│   ├── scan/
│   │   └── ScanResultCard.tsx    # Label scan result display
│   ├── admin/
│   │   └── WineKnowledgePanel.tsx  # Knowledge review UI
│   ├── auth/
│   │   └── PrivacySettings.tsx   # User memory management
│   └── ui/
├── lib/
│   ├── supabase.ts              # Legacy client + wine CRUD
│   ├── supabase-auth.ts         # Browser auth client
│   ├── supabase-auth-server.ts  # Server client + admin ops
│   ├── llm.ts                   # LLM client (Groq/Anthropic)
│   ├── prompts.ts               # System prompts (general + venue + RAG)
│   ├── enrichment.ts            # Wine AI enrichment pipeline
│   ├── embeddings.ts            # OpenAI embedding client
│   ├── wine-chunks.ts           # Wine → embedding-optimized text
│   ├── embedding-pipeline.ts    # Orchestrator: embed/sync/backfill
│   ├── rag.ts                   # Semantic wine search (searchWinesRAG)
│   ├── query-parser.ts          # Italian query intent parser (regex)
│   ├── wine-knowledge.ts        # Deep knowledge generation via LLM
│   ├── memory.ts                # Memory extraction + retrieval + format
│   ├── vision.ts                # Vision API for label scanning
│   ├── wine-matcher.ts          # Match scanned label to venue wines
│   ├── geolocation.ts           # Browser geolocation helpers
│   └── rate-limit.ts            # In-memory rate limiting
├── config/
│   ├── constants.ts             # RAG_THRESHOLD, RAG_TOP_K, MEMORY_* constants
│   └── wine-guides.config.ts
├── contexts/
│   ├── auth-context.tsx
│   └── session-context.tsx
├── hooks/
│   ├── useAdmin.ts
│   ├── useChat.ts
│   └── useVenue.ts
├── types/
│   ├── index.ts                 # Wine, Venue, WineKnowledge types
│   └── user.ts                  # MemoryFragment, UserProfile types
├── middleware.ts
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

**Important:**
- NEVER add "Co-Authored-By: Claude" or any Claude/AI mention in commits
- Keep commits clean and professional

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

### 8.4 Pre-Push Checklist (MANDATORY)

**NEVER push code without running these checks first:**

```bash
# 1. Run linter (catches JSX issues, unused vars, etc.)
npm run lint

# 2. Run TypeScript check (catches type errors)
npx tsc --noEmit

# 3. For significant changes, also run build
npm run build
```

**Rules:**
- ❌ NEVER push if lint has errors
- ❌ NEVER push if TypeScript has errors
- ⚠️ Warnings are acceptable but should be reviewed
- ✅ All checks must pass before `git push`

**For non-trivial changes:**
- Use Reviewer agent to validate implementation
- Test critical flows manually if possible

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

# Embeddings + Vision (OpenAI)
OPENAI_API_KEY=sk-...              # Used for embeddings (text-embedding-3-small) and vision (GPT-4o-mini)

# Memory decay cron
CRON_SECRET=...                    # Auth for /api/cron/memory-decay

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
| Architect | Plans, designs, API contracts, DB schema | Write implementation code |
| Prompt Engineer | AI prompts, anti-hallucination | Implementation code, backend/frontend logic |
| Implementer BE | Backend code (API, DB, lib) | Change architecture, modify frontend |
| Implementer FE | Frontend code + UX/animations | Change API contracts, modify backend |
| Reviewer | Validate, check quality | Write or modify any code |

### 13.3 Communication Protocol

1. All agents read `CLAUDE.md` first
2. Architects produce plans in `plans/`
3. Implementers follow approved plans
4. Reviewers validate against plans
5. Human decides merge/deploy

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

## 15. RAG ARCHITECTURE

> Detailed reference: `docs/ARCHITECTURE-RAG-MEMORY.md`

### 15.1 Overview

RAG (Retrieval-Augmented Generation) replaces the full wine list in the LLM prompt with only the most relevant wines. This reduces token usage from ~150K to ~3K for large venues.

### 15.2 Decision Logic (RULE-008)

```
Venue wines count:
  <=50 wines → Full context path (all wines in prompt, no embeddings)
  >50 wines  → RAG path (embed query → match_wines() → top 8 in prompt)
```

Constants in `config/constants.ts`:
- `RAG_THRESHOLD = 50` (wines cutoff)
- `RAG_TOP_K = 8` (max wines returned)
- `RAG_SIMILARITY_THRESHOLD = 0.4` (minimum cosine similarity)

### 15.3 Indexing Pipeline

```
Wine CRUD/Enrichment → wineToChunkText() → embedText() → wine_embeddings (upsert)
                          ↓ includes knowledge if available
                          ↓ content_hash check: skip if unchanged
```

### 15.4 Search Pipeline

```
User query → parseQueryIntent() → embedText(query) → match_wines(embedding, venue_id, filters)
           → top 8 WineWithRatings → getVenueSystemPromptRAG() → LLM
```

### 15.5 Wine Knowledge

Each wine gets deep sommelier knowledge (producer_history, terroir, pairings, curiosities) generated by LLM after enrichment. Included in chunk text for richer embeddings.

---

## 16. MEMORY SYSTEM

### 16.1 Overview

User memory persists preferences across sessions and venues. Only for authenticated users with `profiling_consent=true` (RULE-009, GDPR compliant).

### 16.2 Fragment Types

| Type | Example |
|------|---------|
| `preference` | "Preferisce Barolo e rossi strutturati" |
| `dislike` | "Non gradisce vini dolci" |
| `purchase` | "Ha ordinato Brunello di Montalcino" |
| `feedback` | "Ha apprezzato il consiglio sul Barbaresco" |
| `context` | "Cena romantica per due" |
| `occasion` | "Anniversario di matrimonio" |

### 16.3 Lifecycle

```
Post-session → LLM extracts fragments → embed → dedup (similarity >0.9) → store
Next chat    → embed query → match_memories() → inject top 5 in prompt
Weekly cron  → decay_memory_weights() (stale >30 days: -5%, min 0.1)
GDPR         → GET/DELETE /api/user/memories, included in /api/user/export
```

### 16.4 Cross-Venue

Memories are user-scoped (not venue-scoped). `source_venue_id` tracks origin but does NOT restrict retrieval. Preferences expressed at Venue A inform recommendations at Venue B.

---

## 17. VERTICAL APP FEATURES

### 17.1 Label Scanning

Camera icon in chat input → captures image → `POST /api/scan-label` (Vision API) → `ScanResultCard` above input.
- Venue mode: matches against venue wine list ("Questo vino e' in carta!")
- General mode: shows wine info with "Chiedi al sommelier" button

### 17.2 Venue Discovery

`POST /api/venues/discover` → cross-venue RAG search → `VenueDiscoveryCard` showing nearby venues with matching wines. Uses pgvector embeddings across all venues + optional Haversine geolocation filtering.

### 17.3 Contextual CTAs (RULE-015)

Every 3rd assistant message in general mode shows a subtle CTA:
- Alternates: "Sei al ristorante? Scannerizza il QR" / "Scopri ristoranti WYN vicino a te"
- Pure UI element, zero LLM token cost
- Never shown in venue mode

---

## 18. DATABASE MIGRATIONS

| # | File | Description |
|---|------|-------------|
| 001 | `001_add_recommended_column.sql` | Initial schema |
| 002 | `002_auth_migration.sql` | Supabase Auth + RLS |
| 003 | `003_venue_location.sql` | Venue geolocation (lat/lng) |
| 004 | `004_app_settings.sql` | App settings |
| 005 | `005_user_profiles.sql` | User profiles + profiling consent |
| 006 | `006_fix_user_profile_trigger.sql` | Fix profile trigger |
| 007 | `007_pgvector_wine_embeddings.sql` | pgvector + wine_embeddings + match_wines() |
| 008 | `008_wine_knowledge.sql` | Deep wine knowledge table |
| 009 | `009_memory_fragments.sql` | Memory fragments + match_memories() + decay |

All migrations are **additive** (no destructive changes). After 007-009: run `POST /api/embeddings/backfill`.

---

## 19. QUICK REFERENCE

### 19.1 Key Files

| Purpose | Location |
|---------|----------|
| Types | `types/index.ts`, `types/user.ts` |
| DB Client (legacy) | `lib/supabase.ts` |
| Auth Client (browser) | `lib/supabase-auth.ts` |
| Auth Client (server) | `lib/supabase-auth-server.ts` |
| Route Protection | `middleware.ts` |
| Admin Hook | `hooks/useAdmin.ts` |
| LLM Client | `lib/llm.ts` |
| AI Prompts | `lib/prompts.ts` |
| Enrichment | `lib/enrichment.ts` |
| Embedding Client | `lib/embeddings.ts` |
| Wine Chunking | `lib/wine-chunks.ts` |
| Embedding Pipeline | `lib/embedding-pipeline.ts` |
| RAG Search | `lib/rag.ts` |
| Query Parser | `lib/query-parser.ts` |
| Wine Knowledge | `lib/wine-knowledge.ts` |
| Memory System | `lib/memory.ts` |
| Vision (label scan) | `lib/vision.ts` |
| RAG Constants | `config/constants.ts` |
| Wine Guides | `config/wine-guides.config.ts` |
| Architecture Docs | `docs/ARCHITECTURE-RAG-MEMORY.md` |
| UI Mockups | `mockup/*.png` |

### 19.2 Common Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # TypeScript check
```

### 19.3 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

## DOCUMENT VERSION

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-30 | Initial | Baseline |
| 1.1.0 | 2025-01-05 | - | Supabase Auth migration, two-tier roles, RLS policies |
| 1.2.0 | 2025-01-09 | - | Added mandatory pre-push checklist (lint, tsc, build) |
| 2.0.0 | 2026-02-25 | - | v2 architecture: RAG, pgvector, wine knowledge, user memory, vertical app features, label scan, venue discovery, CTAs |

---

**This is the authoritative reference. When in doubt, check here first.**
