# PLAN-006: AI Wine Enrichment Feature

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
| Priority | P2 |
| Dependencies | PLAN-002, PLAN-003, PLAN-005 |

---

## 1. Summary

Implement AI-powered wine enrichment that automatically enhances wine entries with ratings, tasting notes, and additional metadata. Enrichment runs asynchronously to avoid blocking the admin UX.

---

## 2. Goals

- Auto-enrich wines when added to the system
- Fetch ratings from configured wine guides
- Generate tasting notes if missing
- Respect confidence thresholds (RULE-006)
- Non-blocking async processing (ADR-003)

---

## 3. Non-Goals

- Real-time rating API integration (use LLM for MVP)
- User-facing enrichment controls
- Enrichment editing UI
- Scheduled re-enrichment

---

## 4. Affected Areas

| Area | Impact |
|------|--------|
| `lib/enrichment.ts` | Core enrichment logic |
| `app/api/enrichment/route.ts` | Enrichment trigger endpoint |
| `app/api/admin/wines/route.ts` | Trigger enrichment on wine create |
| `config/wine-guides.config.ts` | Guide definitions |

---

## 5. Technical Design

### 5.1 Enrichment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENRICHMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Admin adds wine                                                     │
│       │                                                              │
│       ▼                                                              │
│  POST /api/admin/wines                                               │
│       │                                                              │
│       ├──► Wine saved to DB ──► Return immediately to admin         │
│       │                                                              │
│       └──► Trigger enrichment (async, non-blocking)                 │
│                 │                                                    │
│                 ▼                                                    │
│         POST /api/enrichment                                         │
│                 │                                                    │
│                 ▼                                                    │
│         Create enrichment_job (status: pending)                      │
│                 │                                                    │
│                 ▼                                                    │
│         Call LLM for ratings + tasting notes                        │
│                 │                                                    │
│                 ▼                                                    │
│         Parse response, filter by confidence                         │
│                 │                                                    │
│                 ▼                                                    │
│         Save wine_ratings to DB                                      │
│                 │                                                    │
│                 ▼                                                    │
│         Update job (status: completed)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Enrichment Prompt

```typescript
// lib/enrichment.ts

export function buildEnrichmentPrompt(wine: {
  name: string
  producer?: string
  region?: string
  year?: number
  grape_varieties?: string[]
}): string {
  return `Analizza questo vino italiano e fornisci informazioni dettagliate.

VINO:
- Nome: ${wine.name}
${wine.producer ? `- Produttore: ${wine.producer}` : ''}
${wine.region ? `- Regione: ${wine.region}` : ''}
${wine.year ? `- Annata: ${wine.year}` : ''}
${wine.grape_varieties?.length ? `- Vitigni: ${wine.grape_varieties.join(', ')}` : ''}

RICHIESTA:
Fornisci le seguenti informazioni in formato JSON:

{
  "ratings": [
    {
      "guide_id": "gambero-rosso" | "veronelli" | "bibenda" | "wine-spectator" | "robert-parker",
      "guide_name": "Nome guida",
      "score": "punteggio o riconoscimento",
      "confidence": 0.0-1.0,
      "year": anno della valutazione
    }
  ],
  "tasting_notes": "Note di degustazione in italiano (max 200 caratteri)",
  "suggested_pairings": ["abbinamento1", "abbinamento2", "abbinamento3"]
}

REGOLE:
- Includi SOLO valutazioni che conosci con certezza
- confidence < 0.4 = non sicuro, sarà scartato
- confidence 0.4-0.7 = probabile
- confidence > 0.7 = alta certezza
- Se non conosci valutazioni, ritorna array vuoto
- Tasting notes in italiano, concise

Rispondi SOLO con il JSON, senza altro testo.`
}
```

### 5.3 Enrichment Implementation

```typescript
// lib/enrichment.ts

import { chat } from './llm'
import { supabase } from './supabase'
import type { Wine, WineRating } from '@/types'
import { WINE_GUIDES } from '@/config/wine-guides.config'

const MIN_CONFIDENCE = 0.4 // RULE-006

interface EnrichmentResult {
  ratings: Array<{
    guide_id: string
    guide_name: string
    score: string
    confidence: number
    year?: number
  }>
  tasting_notes?: string
  suggested_pairings?: string[]
}

export async function enrichWine(wine: Wine): Promise<boolean> {
  // Create job record
  const { data: job, error: jobError } = await supabase
    .from('enrichment_jobs')
    .insert({
      wine_id: wine.id,
      status: 'processing',
    })
    .select()
    .single()

  if (jobError) {
    console.error('Failed to create enrichment job:', jobError)
    return false
  }

  try {
    // Build prompt
    const prompt = buildEnrichmentPrompt({
      name: wine.name,
      producer: wine.producer || undefined,
      region: wine.region || undefined,
      year: wine.year || undefined,
      grape_varieties: wine.grape_varieties || undefined,
    })

    // Call LLM
    const response = await chat([
      { role: 'system', content: 'Sei un esperto sommelier italiano. Rispondi solo in JSON valido.' },
      { role: 'user', content: prompt },
    ])

    // Parse response
    let result: EnrichmentResult
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      result = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse enrichment response:', parseError)
      throw new Error('Invalid LLM response format')
    }

    // Filter ratings by confidence (RULE-006)
    const validRatings = (result.ratings || []).filter(
      r => r.confidence >= MIN_CONFIDENCE && isValidGuide(r.guide_id)
    )

    // Save ratings
    if (validRatings.length > 0) {
      const ratingsToInsert = validRatings.map(r => ({
        wine_id: wine.id,
        guide_id: r.guide_id,
        guide_name: r.guide_name,
        score: r.score,
        confidence: r.confidence,
        year: r.year,
      }))

      const { error: ratingsError } = await supabase
        .from('wine_ratings')
        .insert(ratingsToInsert)

      if (ratingsError) {
        console.error('Failed to save ratings:', ratingsError)
      }
    }

    // Update wine description if we got tasting notes and wine has none
    if (result.tasting_notes && !wine.description) {
      await supabase
        .from('wines')
        .update({ description: result.tasting_notes })
        .eq('id', wine.id)
    }

    // Mark job complete
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return true
  } catch (error) {
    console.error('Enrichment failed:', error)

    // Mark job failed
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', job.id)

    return false
  }
}

function isValidGuide(guideId: string): boolean {
  return WINE_GUIDES.some(g => g.id === guideId)
}

// Trigger enrichment without waiting (fire-and-forget)
export function triggerEnrichmentAsync(wine: Wine): void {
  // Use fetch to call our own API endpoint
  // This allows the enrichment to run in a separate request context
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/enrichment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wine_id: wine.id }),
  }).catch(err => {
    console.error('Failed to trigger enrichment:', err)
  })
}
```

### 5.4 Enrichment API Endpoint

```typescript
// app/api/enrichment/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enrichWine } from '@/lib/enrichment'

export async function POST(request: NextRequest) {
  try {
    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Fetch wine
    const { data: wine, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wine_id)
      .single()

    if (error || !wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      )
    }

    // Run enrichment (this may take time)
    const success = await enrichWine(wine)

    return NextResponse.json({
      success,
      wine_id,
    })
  } catch (error) {
    console.error('Enrichment API error:', error)
    return NextResponse.json(
      { error: 'Enrichment failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check enrichment status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wineId = searchParams.get('wine_id')

  if (!wineId) {
    return NextResponse.json(
      { error: 'Wine ID required' },
      { status: 400 }
    )
  }

  const { data: job } = await supabase
    .from('enrichment_jobs')
    .select('*')
    .eq('wine_id', wineId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ job })
}
```

### 5.5 Integration with Wine Creation

```typescript
// In app/api/admin/wines/route.ts POST handler

import { triggerEnrichmentAsync } from '@/lib/enrichment'

// After wine is created successfully:
export async function POST(request: NextRequest) {
  // ... existing wine creation code ...

  const wine = await createWine(auth.venue_id, body)

  if (wine) {
    // Trigger async enrichment (non-blocking)
    triggerEnrichmentAsync(wine)
  }

  return NextResponse.json({ wine }, { status: 201 })
}
```

---

## 6. Business Rules Enforcement

| Rule | Implementation |
|------|----------------|
| RULE-005 | Enrichment failure logged, wine remains available |
| RULE-006 | `MIN_CONFIDENCE = 0.4` filter in enrichment.ts |
| ADR-003 | `triggerEnrichmentAsync()` fire-and-forget pattern |

---

## 7. Implementation Steps

### Backend (AGENT_IMPLEMENTER_BE)
1. [ ] Implement `lib/enrichment.ts` with enrichWine function
2. [ ] Implement `app/api/enrichment/route.ts`
3. [ ] Update `app/api/admin/wines/route.ts` to trigger enrichment
4. [ ] Test enrichment with sample wine
5. [ ] Verify confidence filtering works
6. [ ] Verify job status tracking

---

## 8. Test Strategy

- **Unit Test:** Prompt building, response parsing, confidence filtering
- **Integration:** Full enrichment flow with mock LLM
- **Manual:** Add wine via admin, check ratings appear

---

## 9. Rollback Plan

1. Remove enrichment trigger from wine creation
2. Enrichment jobs table can remain (no harm)
3. Existing ratings unaffected

---

## 10. Review Checklist

- [ ] Enrichment runs asynchronously
- [ ] Wine creation returns immediately
- [ ] Confidence filtering respects RULE-006
- [ ] Invalid guide IDs are rejected
- [ ] Job status tracked correctly
- [ ] Errors logged but don't break flow

---

## 11. Future Enhancements (Out of Scope)

- Manual re-enrichment button in admin
- Enrichment queue with rate limiting
- External rating API integration
- Enrichment caching

---

**This plan adds AI intelligence to wine data.**
