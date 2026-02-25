# WYN Platform Evolution: App Verticale Vino + RAG + Memory

## Context

WYN is an AI Sommelier platform (Next.js 14 + Supabase + Tailwind) currently serving Italian restaurants. The current architecture stuffs ALL venue wines into the LLM system prompt - this works for small venues (50 wines ~10K tokens) but **cannot scale** to 1000+ wines (~150K tokens = too expensive, too slow, quality degrades due to "lost in the middle" problem).

**This plan transforms WYN** from a context-window-based sommelier into a **vertical wine app** - an AI-powered personal sommelier that knows the user, scans labels, discovers venues, AND integrates into restaurants. Not a ChatGPT competitor, but a dedicated wine companion that ChatGPT cannot replicate.

**Strategic Vision: Why WYN > ChatGPT for Wine**

ChatGPT can answer generic wine questions. WYN must offer what ChatGPT cannot:
1. **Memory** - Remembers your wine preferences across sessions and venues
2. **Label Scan** - Point camera at bottle, get instant info (code exists, UI needed)
3. **Venue Discovery** - "Where can I drink a good Barolo near me?" + which WYN venues have it
4. **Real wine lists** - At the restaurant, WYN knows exact wines, prices, availability
5. **Deep knowledge** - Terroir, producer history, vintage quality from enriched data

**Goals:**
- Support venues with 1000+ wines at ~3K tokens/request (97% reduction)
- Deep wine knowledge (history, terroir, pairings) like a real sommelier
- User memory that persists across sessions and venues (general mode differentiator)
- Label scanning activated in general mode (code exists, needs UI)
- Venue discovery from general mode (find WYN restaurants nearby)
- Updated CLAUDE.md as single source of truth

> **Widget + API + SDK**: spostati in piano separato → `PLAN-WIDGET-API-SDK.md`

---

## Stato Avanzamento

| Phase | Stato | Commit | Branch |
|-------|-------|--------|--------|
| 1. RAG Foundation | COMPLETATA | ba1e848 | feature/rag-foundation |
| 2. Deep Wine Knowledge | COMPLETATA | cba8dcf | feature/rag-foundation |
| 3. User Memory System | COMPLETATA | 4dd0c7d | feature/rag-foundation |
| 4. Vertical App Features | COMPLETATA | 5a11f63 | feature/rag-foundation |
| 5. CLAUDE.md Update | DA FARE | - | - |

### Da applicare su Supabase (migration SQL)

```
007_pgvector_wine_embeddings.sql  (Phase 1)
008_wine_knowledge.sql            (Phase 2)
009_memory_fragments.sql          (Phase 3)
```

Dopo le migration: `POST /api/embeddings/backfill` per popolare embeddings vini esistenti.

---

## Phase 1: RAG Foundation (Tasks 1-10) - COMPLETATA

> Replace full wine list in prompt with semantic search. Venues >50 wines use RAG, smaller venues keep current approach.

### Task 1: Enable pgvector + create wine_embeddings table
- **Files**: `supabase/migrations/007_pgvector_wine_embeddings.sql`
- **What**: Enable pgvector extension, create `wine_embeddings` table (wine_id, venue_id, embedding vector(1536), content_text, content_hash, wine_type, price, available), HNSW index, RLS policies, `match_wines()` PostgreSQL function for hybrid search (vector similarity + SQL filters)

### Task 2: Create embedding client module
- **Files**: `lib/embeddings.ts`
- **What**: Wrapper for OpenAI `text-embedding-3-small` API. Functions: `embedText(text)`, `embedTexts(texts[])`, `generateContentHash(text)`. Retry with exponential backoff. Batch support.

### Task 3: Create wine content chunking
- **Files**: `lib/wine-chunks.ts`
- **What**: `wineToChunkText(wine)` - converts wine into embedding-optimized text. Format optimized for Italian semantic search.

### Task 4: Create embedding pipeline orchestrator
- **Files**: `lib/embedding-pipeline.ts`
- **What**: `embedWine(wineId)`, `embedVenueWines(venueId)`, `syncEmbedding(wineId)` (check hash, skip if unchanged). Upserts into `wine_embeddings`.

### Task 5: Create embedding API endpoints
- **Files**: `app/api/embeddings/route.ts`, `app/api/embeddings/sync/route.ts`, `app/api/embeddings/backfill/route.ts`
- **What**: Admin-triggered batch embedding, single-wine sync, backfill for existing data.

### Task 6: Hook embedding into wine lifecycle
- **Files**: Modified `lib/supabase.ts`, `lib/enrichment.ts`
- **What**: After wine create/update → trigger async embedding. After enrichment → re-embed. Toggle availability → update flag directly.

### Task 7: Create RAG search module
- **Files**: `lib/rag.ts`
- **What**: `searchWinesRAG({venueId, query, topK, threshold, ...})`. Embeds query, calls `match_wines()`, loads full wine data, formats as `ragContext`.

### Task 8: Create query intent parser
- **Files**: `lib/query-parser.ts`
- **What**: Lightweight regex parser (NOT LLM) for Italian wine queries. Extracts wineType, maxPrice, minPrice, region hints. Zero latency, zero cost.

### Task 9: Create RAG-aware prompt builder
- **Files**: Modified `lib/prompts.ts`
- **What**: `getVenueSystemPromptRAG(venueName, ragResult, totalWineCount)` - prompt with only retrieved wines (~8).

### Task 10: Integrate RAG into chat API route
- **Files**: Modified `app/api/chat/route.ts`, `config/constants.ts`
- **What**: Decision logic: `wines.length <= RAG_THRESHOLD (50)` → current path; `> RAG_THRESHOLD` → RAG path.

---

## Phase 2: Deep Wine Knowledge (Tasks 11-16) - COMPLETATA

> Enrich each wine with sommelier-quality knowledge.

### Task 11: Create wine_knowledge table
- **Files**: `supabase/migrations/008_wine_knowledge.sql`

### Task 12: Add WineKnowledge types
- **Files**: Modified `types/index.ts`

### Task 13: Create knowledge generation module
- **Files**: `lib/wine-knowledge.ts`

### Task 14: Integrate knowledge into enrichment + embedding pipeline
- **Files**: Modified `lib/enrichment.ts`, `lib/wine-chunks.ts`, `lib/embedding-pipeline.ts`

### Task 15: Knowledge review API
- **Files**: `app/api/admin/wines/[wineId]/knowledge/route.ts`

### Task 16: Knowledge review UI in admin panel
- **Files**: `components/admin/WineKnowledgePanel.tsx`

---

## Phase 3: User Memory System (Tasks 17-25) - COMPLETATA

> Persistent user memory across sessions and venues.

### Task 17: Create memory_fragments table
- **Files**: `supabase/migrations/009_memory_fragments.sql`

### Task 18: Add memory types
- **Files**: Modified `types/user.ts`

### Task 19: Create memory extraction module
- **Files**: `lib/memory.ts`

### Task 20: Wire memory extraction into post-session flow
- **Files**: Modified `app/api/chat-session/analyze/route.ts`

### Task 21: Memory retrieval for chat
- **Files**: `lib/memory.ts` (retrieveRelevantMemories, formatMemoriesForPrompt)

### Task 22: Integrate memories into chat prompt
- **Files**: Modified `app/api/chat/route.ts`

### Task 23: Memory decay cron
- **Files**: `app/api/cron/memory-decay/route.ts`

### Task 24: GDPR compliance for memories
- **Files**: `app/api/user/memories/route.ts`, modified `app/api/user/export/route.ts`

### Task 25: Cross-venue memory validation
- By design: memories are user-scoped, source_venue_id tracks origin but doesn't restrict retrieval.

---

## Phase 4: Vertical Wine App Features (Tasks 41-43) - IN CORSO

> Activate existing code and add features that differentiate WYN from ChatGPT in general mode. **Critical for product-market fit.**

### Task 41: Activate label scanning in general mode
- **Files**: Modify `components/chat/ChatInput.tsx`, modify `components/chat/ChatContainer.tsx`
- **What**: Code for label scanning already exists (`lib/vision.ts`, `lib/wine-matcher.ts`, `app/api/scan-label/route.ts`, `components/scan/*`). Currently integrated in chat via ImageAttachment component. Ensure scan results flow smoothly as chat messages. In venue mode, match against venue's wine list.
- **Depends on**: Nothing (code exists, just needs UI wiring)
- **Validation**: User scans bottle label from chat → gets wine info as message; in venue mode also shows "Questo vino e' nella carta!" if matched

### Task 42: Venue discovery from general mode
- **Files**: Create `components/chat/VenueDiscoveryCard.tsx`, create `app/api/venues/discover/route.ts`
- **What**: When user asks about a specific wine in general mode, show a discovery card: "Questo vino potrebbe essere disponibile presso Locale X, Locale Y, Locale Z vicino a te". Uses existing `/api/venues/nearby` endpoint + cross-reference with wine embeddings (RAG cross-venue search). Card appears below AI response (UI element, not LLM output).
- **Depends on**: Phase 1 (RAG for wine search across venues)
- **Validation**: Ask "Consigliami un Barolo" → AI responds → card shows "Disponibile presso 3 locali WYN vicino a te"

### Task 43: Contextual CTA in general mode
- **Files**: Modify `components/chat/ChatMessage.tsx`
- **What**: Subtle, non-intrusive CTAs after general mode responses. Show every 3rd message (not every one). Variants:
  - "Sei al ristorante? Scannerizza il QR" → opens scanner
  - "Scopri ristoranti WYN vicino a te" → opens venue discovery
  - CTA is a UI element, NOT part of LLM prompt (zero token cost)
- **Depends on**: Nothing
- **Validation**: CTA appears every 3rd message in general mode; never in venue mode

### Phase 4 Validation Checklist
- [ ] Label scan accessible from chat input (camera icon)
- [ ] Scan results appear as chat message
- [ ] Venue discovery card shows when relevant
- [ ] CTA rotation works (every 3rd message)
- [ ] None of these features cost extra LLM tokens
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Phase 5: Update CLAUDE.md (Task 40)

### Task 40: Rewrite CLAUDE.md with new architecture
- **Files**: Modify `CLAUDE.md`
- **What**: Update all sections to reflect v2 architecture:
  - **Section 2 (Architecture)**: New diagram with pgvector, RAG pipeline
  - **Section 3 (Domain Model)**: Add Embedding Context, Memory Context
  - **Section 5 (Project Structure)**: Add new files/directories
  - **Section 9 (Environment Variables)**: Add `OPENAI_API_KEY` for embeddings
  - **Section 3.3 (Business Rules)**: Add RULE-008 through RULE-015
  - **Section 4.2 (ADR)**: Update ADR-001 (pgvector for >50 wines)
  - **New Section: RAG Architecture**: Embedding pipeline, hybrid search, threshold logic
  - **New Section: Memory System**: Fragment types, decay, GDPR, cross-venue
- **Depends on**: All previous phases
- **Validation**: CLAUDE.md is complete, accurate, and serves as single source of truth

---

## Cost Summary

| Phase | One-Time | Monthly (10K users) |
|-------|----------|---------------------|
| 1. RAG | ~$5 (backfill embeddings) | ~$0.10 (query embeddings) |
| 2. Knowledge | ~$10 (generate for existing) | ~$1 (new wines) |
| 3. Memory | $0 | ~$12 (extraction LLM) |
| **TOTAL** | **~$15** | **~$13/month** |

Current cost (full context, 10K users): ~$150/month. **RAG saves ~$137/month (91%).**

---

## Business Rules

```
RULE-008: Venues with >50 wines use RAG search; <=50 use full context
RULE-009: Memory extraction requires authenticated user with profiling_consent=true
RULE-010: Memory fragments decay 5%/month weight when not accessed for 30 days
RULE-013: Deep knowledge generation uses best available model for accuracy
RULE-014: General mode has NO rate limit - it's the vertical app core
RULE-015: General mode responses include contextual CTA toward venue mode
```

---

## Database Migrations Summary

| # | File | Phase | Description |
|---|------|-------|-------------|
| 007 | `007_pgvector_wine_embeddings.sql` | 1 | pgvector + wine_embeddings + match_wines() |
| 008 | `008_wine_knowledge.sql` | 2 | Deep wine knowledge table |
| 009 | `009_memory_fragments.sql` | 3 | User memories + match_memories() + decay |

All migrations are **additive** (no destructive changes to existing tables).

---

## Piani futuri (separati)

- **Widget + API + SDK**: vedi `PLAN-WIDGET-API-SDK.md`

---

## Environment Variables

```env
# Existing (already required)
OPENAI_API_KEY=sk-...          # Now also used for embeddings

# For memory decay cron
CRON_SECRET=...
```

---

## Implementation Order

```
Phase 1 (RAG):            Tasks 1-10   → COMPLETATA (ba1e848)
Phase 2 (Knowledge):      Tasks 11-16  → COMPLETATA (cba8dcf)
Phase 3 (Memory):         Tasks 17-25  → COMPLETATA (4dd0c7d)
Phase 4 (Vertical App):   Tasks 41-43  → COMPLETATA (5a11f63)
Phase 5 (CLAUDE.md):      Task 40      → DA FARE
```

Each phase is independently deployable. The system remains fully functional after each phase deployment.
