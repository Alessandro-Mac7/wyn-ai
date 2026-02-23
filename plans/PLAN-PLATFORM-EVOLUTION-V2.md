# WYN Platform Evolution: App Verticale Vino + RAG + Memory + Widget + SDK

## Context

WYN is an AI Sommelier platform (Next.js 14 + Supabase + Tailwind) currently serving Italian restaurants. The current architecture stuffs ALL venue wines into the LLM system prompt - this works for small venues (50 wines ~10K tokens) but **cannot scale** to 1000+ wines (~150K tokens = too expensive, too slow, quality degrades due to "lost in the middle" problem).

**This plan transforms WYN** from a context-window-based sommelier into a **vertical wine app** - an AI-powered personal sommelier that knows the user, scans labels, discovers venues, AND integrates into restaurants. Not a ChatGPT competitor, but a dedicated wine companion that ChatGPT cannot replicate.

**Strategic Vision: Why WYN > ChatGPT for Wine**

ChatGPT can answer generic wine questions. WYN must offer what ChatGPT cannot:
1. **Memory** - Remembers your wine preferences across sessions and venues
2. **Label Scan** - Point camera at bottle, get instant info (code exists, UI needed)
3. **Venue Discovery** - "Where can I drink a good Barolo near me?" → WYN partner map
4. **Real wine lists** - At the restaurant, WYN knows exact wines, prices, availability
5. **Deep knowledge** - Terroir, producer history, vintage quality from enriched data

Without these, general mode is pointless (users go to ChatGPT). With these, WYN becomes an indispensable wine app.

**Goals:**
- Support venues with 1000+ wines at ~3K tokens/request (97% reduction)
- Deep wine knowledge (history, terroir, pairings) like a real sommelier
- User memory that persists across sessions and venues (general mode differentiator)
- Label scanning activated in general mode (code exists, needs UI)
- Venue discovery from general mode (find WYN restaurants nearby)
- Embeddable widget for any website
- Public API + SDK for custom integrations
- Updated CLAUDE.md as single source of truth

---

## Target Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     WYN ARCHITECTURE v2                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NEXT.JS 14 APP                                                      │
│  ├── Pages: /, /chat, /v/[slug], /admin/*, /internal/*, /widget/*   │
│  ├── API:   /api/chat (RAG), /api/v1/* (Public), /api/widget/*      │
│  └── Lib:   llm.ts, prompts.ts, rag.ts, embeddings.ts,             │
│             memory.ts, wine-knowledge.ts, widget-bridge.ts           │
│                                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐               │
│  │  SUPABASE    │  │  LLM APIs   │  │  EMBEDDING   │               │
│  │  PostgreSQL  │  │  Groq/OAI/  │  │  API (OAI)   │               │
│  │  + pgvector  │  │  Anthropic  │  │  3-small     │               │
│  └──────┬───────┘  └─────────────┘  └──────────────┘               │
│         │                                                            │
│  NEW TABLES:                                                         │
│  ├── wine_embeddings (vector 1536, hybrid search)                   │
│  ├── wine_knowledge (deep structured knowledge)                     │
│  ├── memory_fragments (user memories + embeddings)                  │
│  ├── widget_configs (per-venue widget settings)                     │
│  └── api_keys (public API access)                                   │
│                                                                      │
│  EMBEDDABLE WIDGET                                                   │
│  <script src="wyn.app/widget/loader.js" data-venue="slug" />       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: RAG Foundation (Tasks 1-10)

> Replace full wine list in prompt with semantic search. Venues >50 wines use RAG, smaller venues keep current approach.

### Task 1: Enable pgvector + create wine_embeddings table
- **Files**: `supabase/migrations/007_pgvector_wine_embeddings.sql`
- **What**: Enable pgvector extension, create `wine_embeddings` table (wine_id, venue_id, embedding vector(1536), content_text, content_hash, wine_type, price, available), HNSW index, RLS policies, `match_wines()` PostgreSQL function for hybrid search (vector similarity + SQL filters)
- **Depends on**: Nothing
- **Validation**: `SELECT * FROM pg_extension WHERE extname = 'vector'` returns row; `match_wines()` function exists

### Task 2: Create embedding client module
- **Files**: Create `lib/embeddings.ts`
- **What**: Wrapper for OpenAI `text-embedding-3-small` API. Functions: `embedText(text)`, `embedTexts(texts[])`, `generateContentHash(text)`. Retry with exponential backoff (reuse pattern from `lib/enrichment.ts:12-44`). Batch support (up to 2048 texts/call).
- **Depends on**: Nothing
- **Validation**: Unit test mocking OpenAI API verifies request format and response parsing

### Task 3: Create wine content chunking
- **Files**: Create `lib/wine-chunks.ts`
- **What**: `wineToChunkText(wine: WineWithRatings): string` - converts wine into embedding-optimized text. Includes: name, producer, region, denomination, type, price, grapes, year, ratings (normalized), description, tasting notes. Format optimized for Italian semantic search.
- **Depends on**: Nothing (uses existing `WineWithRatings` from `types/index.ts:51`)
- **Validation**: Unit test generates chunks for various wines, all fields present, ~150-300 tokens each

### Task 4: Create embedding pipeline orchestrator
- **Files**: Create `lib/embedding-pipeline.ts`
- **What**: `embedWine(wineId)`, `embedVenueWines(venueId)`, `syncEmbedding(wineId)` (check hash, skip if unchanged). Uses `supabaseAdmin` from `lib/supabase-auth-server.ts` for RLS bypass. Upserts into `wine_embeddings`.
- **Depends on**: Tasks 1, 2, 3
- **Validation**: Create wine, run pipeline, verify row in `wine_embeddings` with correct hash

### Task 5: Create embedding API endpoints
- **Files**: Create `app/api/embeddings/route.ts`, `app/api/embeddings/sync/route.ts`, `app/api/embeddings/backfill/route.ts`
- **What**: Admin-triggered batch embedding, single-wine sync (called async after CRUD), backfill for existing data (batched to avoid timeouts)
- **Depends on**: Task 4
- **Validation**: POST `/api/embeddings` with `{venue_id}` embeds all venue wines, returns count

### Task 6: Hook embedding into wine lifecycle
- **Files**: Modify `lib/supabase.ts` (createWine, updateWine, toggleWineAvailability), modify `lib/enrichment.ts` (after enrichment completes at ~line 250)
- **What**: After wine create/update → trigger async embedding. After enrichment → re-embed (content hash changed). Toggle availability → update `wine_embeddings.available` directly (no re-embed needed).
- **Depends on**: Tasks 4, 5
- **Validation**: Create wine via admin panel → embedding appears; enrich wine → embedding updated; toggle availability → filter works

### Task 7: Create RAG search module
- **Files**: Create `lib/rag.ts`
- **What**: `searchWinesRAG({venueId, query, topK=8, threshold=0.4, onlyAvailable, wineType, maxPrice, minPrice}): Promise<RAGSearchResult>`. Embeds query, calls `match_wines()` DB function, loads full wine data for matched IDs, formats as `ragContext` string.
- **Depends on**: Tasks 1, 2
- **Validation**: Search "rosso corposo per bistecca" returns relevant red wines sorted by similarity

### Task 8: Create query intent parser
- **Files**: Create `lib/query-parser.ts`
- **What**: Lightweight regex parser (NOT LLM) for Italian wine queries. Extracts: `wineType` ("rosso"→red, "bianco"→white, "bollicine"→sparkling), `maxPrice` ("sotto 30 euro"), `minPrice` ("almeno 20"), region hints ("toscano"). Zero latency, zero cost.
- **Depends on**: Nothing
- **Validation**: Unit tests with 20+ Italian wine query patterns

### Task 9: Create RAG-aware prompt builder
- **Files**: Modify `lib/prompts.ts`
- **What**: Add `getVenueSystemPromptRAG(venueName, ragResult, totalWineCount)` alongside existing `getVenueSystemPrompt` (line 46). RAG prompt includes only retrieved wines (~8) with full details, plus note about total catalog size. Same rules as current prompt.
- **Depends on**: Task 7
- **Validation**: Token count for 1000-wine venue: ~2,500 (vs current ~150,000)

### Task 10: Integrate RAG into chat API route
- **Files**: Modify `app/api/chat/route.ts` (lines 98-114), modify `config/constants.ts`
- **What**: Add decision logic: `wines.length <= RAG_THRESHOLD (50)` → current path; `> RAG_THRESHOLD` → RAG path. Parse query intent first, then search, then build RAG prompt. Add constants: `RAG_THRESHOLD=50`, `RAG_TOP_K=8`, `RAG_SIMILARITY_THRESHOLD=0.4`.
- **Depends on**: Tasks 7, 8, 9
- **Validation**: Chat with 100-wine venue uses RAG (check logs); chat with 30-wine venue uses full context; responses are accurate in both modes

### Phase 1 Validation Checklist
- [ ] pgvector extension active on Supabase
- [ ] All existing wines have embeddings (backfill ran)
- [ ] Venue with >50 wines uses RAG path (token count ~3K vs ~18K+)
- [ ] Venue with <=50 wines uses full context (backward compatible)
- [ ] New wines auto-embed on create
- [ ] Updated wines re-embed when content changes
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

## Phase 2: Deep Wine Knowledge (Tasks 11-16)

> Enrich each wine with sommelier-quality knowledge: producer history, terroir, vinification, pairings, serving tips.

### Task 11: Create wine_knowledge table
- **Files**: `supabase/migrations/008_wine_knowledge.sql`
- **What**: Table with: producer_history, producer_philosophy, terroir_description, vineyard_details, soil_type, climate, vinification_process, aging_method, aging_duration, vintage_notes, vintage_quality (enum), food_pairings (JSONB array of `{category, dishes[], match, notes}`), serving_temperature, decanting_time, glass_type, anecdotes, curiosities[], knowledge_version, reviewed_at, reviewed_by. RLS: public read, service_role write.
- **Depends on**: Nothing
- **Validation**: Table created, RLS active

### Task 12: Add WineKnowledge types
- **Files**: Modify `types/index.ts`
- **What**: Add `WineKnowledge`, `FoodPairingDetailed` interfaces. Export alongside existing types.
- **Depends on**: Nothing
- **Validation**: `npx tsc --noEmit` passes

### Task 13: Create knowledge generation module
- **Files**: Create `lib/wine-knowledge.ts`
- **What**: `generateWineKnowledge(wine: WineWithRatings): Promise<WineKnowledge>`. Uses best available LLM (GPT-4o-mini or Claude Haiku) with structured JSON prompt requesting all knowledge fields. Retry with backoff. Stores in `wine_knowledge` table.
- **Depends on**: Tasks 11, 12
- **Validation**: Generate knowledge for known wine (e.g., Barolo Biondi-Santi), verify producer history accuracy

### Task 14: Integrate knowledge into enrichment + embedding pipeline
- **Files**: Modify `lib/enrichment.ts`, modify `lib/wine-chunks.ts`, modify `lib/embedding-pipeline.ts`
- **What**: After enrichment completes → trigger knowledge generation as async step. Update `wineToChunkText()` to include deep knowledge when available (richer embeddings). Re-embed after knowledge generation.
- **Depends on**: Tasks 13, 4
- **Validation**: Create wine → enrichment → knowledge generation → re-embedding. Full pipeline runs end-to-end.

### Task 15: Knowledge review API
- **Files**: Create `app/api/admin/wines/[wineId]/knowledge/route.ts`
- **What**: GET returns knowledge for wine, PUT allows admin to edit/correct AI-generated knowledge (triggers re-embedding). Auth: venue owner or super_admin.
- **Depends on**: Task 13
- **Validation**: GET returns knowledge, PUT updates and re-embeds

### Task 16: Knowledge review UI in admin panel
- **Files**: Create `components/admin/WineKnowledge.tsx`, modify `components/admin/WineModal.tsx` or `WineSidebar.tsx`
- **What**: Add "Conoscenza" tab to wine detail view. Shows AI-generated knowledge with editable fields. "Rivedi" button marks as human-reviewed. Indicator for reviewed vs AI-only.
- **Depends on**: Task 15
- **Validation**: Admin can view, edit, approve knowledge. Re-embedding triggers on save.

### Phase 2 Validation Checklist
- [ ] Knowledge generated for sample wines is accurate
- [ ] Embeddings include deep knowledge (richer search results)
- [ ] Admin can review and edit knowledge
- [ ] Re-embedding triggers after knowledge update
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Phase 3: User Memory System (Tasks 17-25)

> Persistent user memory across sessions and venues. The AI remembers preferences, past purchases, and feedback. **CRITICAL for differentiating from ChatGPT.**

### Task 17: Create memory_fragments table
- **Files**: `supabase/migrations/009_memory_fragments.sql`
- **What**: Table: user_id, fragment_type (preference|purchase|feedback|context|dislike|occasion), content (text), embedding (vector 1536), metadata (JSONB), weight (float 0-1, decays over time), last_relevant_at, source_session_id, source_venue_id. HNSW index on embedding. RLS: users read/delete own, service_role manages all. `match_memories()` function with weight-adjusted similarity. `decay_memory_weights()` function.
- **Depends on**: Phase 1 (pgvector enabled)
- **Validation**: Table created, functions work, RLS enforced

### Task 18: Add memory types
- **Files**: Modify `types/user.ts`
- **What**: Add `MemoryFragment`, `MemoryFragmentType` types.
- **Depends on**: Nothing
- **Validation**: `npx tsc --noEmit` passes

### Task 19: Create memory extraction module
- **Files**: Create `lib/memory.ts`
- **What**: `extractMemories(messages: ChatMessage[], userId: string, venueId?: string): Promise<MemoryFragment[]>`. Uses LLM to extract discrete memory fragments from conversation. Each fragment is embedded and stored with type, content, metadata. Deduplicates against existing memories (semantic similarity > 0.9 = update instead of create).
- **Depends on**: Tasks 17, 18, 2 (embeddings)
- **Validation**: Extract memories from test conversation, verify correct types and content

### Task 20: Wire memory extraction into post-session flow
- **Files**: Modify `app/api/chat-session/analyze/route.ts`, modify `lib/preference-extractor.ts`
- **What**: After chat session ends (or after N messages), extract memory fragments and store with embeddings. Only for authenticated users with `profiling_consent=true`. Integrates with existing preference extraction (builds richer profile from memories).
- **Depends on**: Task 19
- **Validation**: End chat session → memories created in DB → preferences updated

### Task 21: Memory retrieval for chat
- **Files**: Add to `lib/memory.ts`
- **What**: `retrieveRelevantMemories(userId, query, topK=5): Promise<MemoryFragment[]>`. Embeds query, calls `match_memories()`, returns top-K. Bumps `last_relevant_at` on retrieved memories (prevents decay).
- **Depends on**: Task 17
- **Validation**: Query "rosso per bistecca" returns preference memories about red wine and meat

### Task 22: Integrate memories into chat prompt
- **Files**: Modify `app/api/chat/route.ts`, modify `lib/prompts.ts`
- **What**: Add `getMemoryPromptSection(memories)` to prompts.ts. In chat route: if user is authenticated + has profiling consent → retrieve memories → inject into system prompt as "CIO CHE SAI DI QUESTO CLIENTE" section. Rules: use to personalize, don't mention explicitly unless user brings it up.
- **Depends on**: Tasks 21, 9/10 (RAG chat integration)
- **Validation**: Authenticated user gets personalized responses based on stored memories

### Task 23: Memory decay cron
- **Files**: Create `app/api/cron/memory-decay/route.ts`
- **What**: Vercel cron endpoint (runs weekly). Calls `decay_memory_weights()` to reduce weight by 5% for memories not accessed in 30 days. Minimum weight: 0.1 (never fully forgotten).
- **Depends on**: Task 17
- **Validation**: Run cron, verify old memories have reduced weights, recently accessed ones unchanged

### Task 24: GDPR compliance for memories
- **Files**: Create `supabase/migrations/010_gdpr_memories.sql`, create `app/api/user/memories/route.ts`, modify `components/auth/PrivacySettings.tsx`
- **What**: Update `export_user_data` function to include memories. API: GET lists all user memories, DELETE removes specific or all memories. UI: "I miei ricordi" section in privacy settings - view, delete individual, bulk delete.
- **Depends on**: Tasks 17, 19
- **Validation**: GDPR export includes memories; user can view and delete memories; deletion cascades correctly

### Task 25: Cross-venue memory validation
- **Files**: No new files (architecture test)
- **What**: Verify memories are user-level (not venue-scoped). User chats at Venue A, memories created. User visits Venue B, memories from Venue A inform recommendations. `source_venue_id` tracks origin but doesn't restrict retrieval.
- **Depends on**: Tasks 20, 22
- **Validation**: End-to-end test: chat at Venue A about Barolo preference → visit Venue B → Barolo-like wines prioritized

### Phase 3 Validation Checklist
- [ ] Memories extracted correctly from conversations
- [ ] Only for users with profiling consent (GDPR)
- [ ] Memories influence chat responses (personalization)
- [ ] Cross-venue memory works
- [ ] Decay reduces stale memory weights
- [ ] User can view and delete all memories
- [ ] GDPR export includes memories
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Phase 4: Embeddable Widget (Tasks 26-32)

> Lightweight chat widget embeddable on any website via a single script tag.

### Task 26: Create widget_configs table
- **Files**: `supabase/migrations/011_widget_configs.sql`
- **What**: Table: venue_id (unique), theme (JSONB: primaryColor, backgroundColor, textColor, fontFamily, borderRadius, position), welcome_message, placeholder_text, auto_open, auto_open_delay_seconds, show_powered_by, custom_logo_url, allowed_domains[], api_key (unique, auto-generated), enabled. RLS: venue owners manage own.
- **Depends on**: Nothing
- **Validation**: Table created, auto-generated API key works

### Task 27: Create widget API endpoints
- **Files**: Create `app/api/widget/init/route.ts`, `app/api/widget/chat/route.ts`
- **What**: Auth by `X-Widget-Key` header (not Supabase session). Init returns venue info + config + welcome message. Chat uses same RAG/full-context logic as main chat API but authenticated by widget key. Widget-specific rate limits per API key.
- **Depends on**: Task 26
- **Validation**: Widget key auth works, chat returns venue-scoped responses, rate limiting per key

### Task 28: Create widget embed page
- **Files**: Create `app/widget/embed/page.tsx`, `app/widget/embed/layout.tsx`
- **What**: Standalone page rendered inside iframe. Minimal layout (no sidebar, no nav). Reads config from parent via URL params or postMessage. Uses widget API endpoints.
- **Depends on**: Task 27
- **Validation**: Page renders in iframe, chat works, theming applied

### Task 29: Create widget chat components
- **Files**: Create `components/widget/WidgetChat.tsx`, `components/widget/WidgetMessage.tsx`, `components/widget/WidgetInput.tsx`
- **What**: Lightweight chat components optimized for small viewports and iframe. Similar to main chat UI but stripped down. Must work without auth context, sidebar, or venue selector.
- **Depends on**: Task 28
- **Validation**: Widget is interactive, responsive, total JS bundle < 50KB

### Task 30: Create loader script + postMessage bridge
- **Files**: Create `public/widget/loader.js`, create `lib/widget-bridge.ts`
- **What**: Loader (<5KB): reads data-venue and data-key from script tag, creates floating bubble button, creates iframe on click, sets up postMessage communication. Bridge: handles resize, open/close, theme updates between parent and iframe.
- **Depends on**: Task 28
- **Validation**: `<script src=".../loader.js" data-venue="x" data-key="y">` creates working widget

### Task 31: Widget configuration admin UI
- **Files**: Create `components/admin/WidgetConfigurator.tsx`, `components/admin/WidgetPreview.tsx`, `components/admin/EmbedCodeGenerator.tsx`
- **What**: Section in admin dashboard. Theme customizer with live preview. Domain allowlist. Copy embed code button. API key display (masked, revealable).
- **Depends on**: Tasks 26, 30
- **Validation**: Admin configures widget, sees live preview, copies embed code, code works on external page

### Task 32: Add widget admin page/route
- **Files**: Create `app/admin/dashboard/widget/page.tsx` or add to existing dashboard
- **What**: Page that hosts the widget configurator components. Accessible from admin navigation.
- **Depends on**: Task 31
- **Validation**: Navigate to widget config from admin panel, full CRUD works

### Phase 4 Validation Checklist
- [ ] Widget loads on external HTML page with single script tag
- [ ] Chat works through widget (RAG path)
- [ ] Theme customization applies correctly
- [ ] Domain allowlist enforced
- [ ] Rate limiting per widget API key
- [ ] Admin can configure and preview widget
- [ ] Widget JS bundle < 50KB
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Phase 5: Public API + SDK (Tasks 33-39)

> Versioned REST API with API key auth, usage tracking, webhooks, and TypeScript SDK.

### Task 33: Create api_keys table
- **Files**: `supabase/migrations/012_api_keys.sql`
- **What**: Table: venue_id, key_hash (SHA-256), key_prefix (first 8 chars), name, scopes[] (chat, search, wines), rate_limit_per_minute, rate_limit_per_day, total_requests, last_used_at, enabled, expires_at. Separate from widget keys (different auth model).
- **Depends on**: Nothing
- **Validation**: Table created, key generation works

### Task 34: API key auth middleware
- **Files**: Create `lib/api-auth.ts`
- **What**: `authenticateApiKey(request): Promise<{venue: Venue, scopes: string[]}>`. Validates `Authorization: Bearer wyn_k_xxx` header, checks key exists/enabled/not expired, verifies scopes, applies per-key rate limits, increments usage counter.
- **Depends on**: Task 33
- **Validation**: Valid key → access granted; invalid → 401; expired → 403; wrong scope → 403

### Task 35: Public REST API v1 routes
- **Files**: Create `app/api/v1/chat/route.ts`, `app/api/v1/wines/route.ts`, `app/api/v1/wines/search/route.ts`, `app/api/v1/wines/[wineId]/route.ts`, `app/api/v1/venue/route.ts`
- **What**: All authenticated by API key. Chat: same RAG logic. Wines: list/search with pagination. Search: semantic search endpoint. Venue: venue info. Standard JSON responses with consistent error format.
- **Depends on**: Tasks 34, Phase 1 (RAG)
- **Validation**: All endpoints work with API key, return proper JSON, rate limiting enforced

### Task 36: Usage tracking
- **Files**: Create `supabase/migrations/013_api_usage.sql`, create `lib/api-usage.ts`
- **What**: `api_usage_daily` table: api_key_id, date, endpoint, request_count, token_count. Increment on each API call. Summary views for billing.
- **Depends on**: Task 33
- **Validation**: API calls increment counters, daily aggregation works

### Task 37: API key management UI
- **Files**: Create `app/api/admin/api-keys/route.ts`, create `components/admin/ApiKeyManager.tsx`
- **What**: CRUD for API keys. Admin can create (returns full key once), list (masked), revoke. Show usage stats per key.
- **Depends on**: Tasks 33, 36
- **Validation**: Admin creates key, uses it to call API, sees usage in dashboard

### Task 38: Webhook system
- **Files**: Create `supabase/migrations/014_webhooks.sql`, create `lib/webhooks.ts`, create `app/api/admin/webhooks/route.ts`
- **What**: `webhooks` table: venue_id, url, events[], secret (HMAC), enabled. Events: wine.created/updated/deleted, chat.completed, recommendation.made. Delivery with retry (3 attempts). HMAC signature verification.
- **Depends on**: Nothing
- **Validation**: Create webhook, trigger event, verify delivery

### Task 39: TypeScript SDK
- **Files**: Create `sdk/` directory: `sdk/src/index.ts`, `sdk/src/client.ts`, `sdk/src/types.ts`, `sdk/package.json`, `sdk/tsconfig.json`, `sdk/README.md`
- **What**: `WynClient({apiKey})` with methods: `chat(message, options?)`, `wines.list(options?)`, `wines.search(query, options?)`, `wines.get(id)`, `venue.info()`. Typed responses. Works in Node.js and browser.
- **Depends on**: Task 35
- **Validation**: Import SDK, make API calls, types are correct

### Phase 5 Validation Checklist
- [ ] API keys generated and authenticated correctly
- [ ] All v1 endpoints return correct data
- [ ] Rate limiting per API key works
- [ ] Usage tracking counts requests
- [ ] Webhooks deliver on events
- [ ] SDK wraps all endpoints with types
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Phase 6: Update CLAUDE.md (Task 40)

### Task 40: Rewrite CLAUDE.md with new architecture
- **Files**: Modify `CLAUDE.md`
- **What**: Update all sections to reflect v2 architecture:
  - **Section 2 (Architecture)**: New diagram with pgvector, RAG pipeline, widget, public API
  - **Section 3 (Domain Model)**: Add Embedding Context, Memory Context, Widget Context, API Context
  - **Section 5 (Project Structure)**: Add new files/directories
  - **Section 9 (Environment Variables)**: Add `OPENAI_API_KEY` for embeddings
  - **Section 3.3 (Business Rules)**: Add RULE-008 through RULE-015
  - **Section 4.2 (ADR)**: Update ADR-001 (pgvector for >50 wines), add ADR-007 through ADR-011
  - **New Section: RAG Architecture**: Embedding pipeline, hybrid search, threshold logic
  - **New Section: Memory System**: Fragment types, decay, GDPR, cross-venue
  - **New Section: Widget Integration**: Loader, iframe, postMessage, configuration
  - **New Section: Public API**: Versioning, auth, rate limits, SDK
- **Depends on**: All phases
- **Validation**: CLAUDE.md is complete, accurate, and serves as single source of truth

---

## Phase 7: Vertical Wine App Features (Tasks 41-43)

> These tasks activate existing code and add features that differentiate WYN from ChatGPT in general mode. **Critical for product-market fit.**

### Task 41: Activate label scanning in general mode
- **Files**: Modify `components/chat/ChatInput.tsx` (add scan button), modify `app/scan/page.tsx` (integrate results into chat), modify `components/chat/ChatContainer.tsx`
- **What**: Code for label scanning already exists (`lib/vision.ts`, `lib/wine-matcher.ts`, `app/api/scan-label/route.ts`, `components/scan/*`). Currently isolated in `/scan` page. Integrate into chat flow: user taps camera icon in chat input → scans label → results appear as chat message with wine info. In venue mode, also match against venue's wine list.
- **Depends on**: Nothing (code exists, just needs UI wiring)
- **Validation**: User scans bottle label from chat → gets wine info as message; in venue mode also shows "Questo vino e' nella carta!" if matched

### Task 42: Venue discovery from general mode
- **Files**: Create `components/chat/VenueDiscoveryCard.tsx`, modify `app/api/chat/route.ts`, modify `lib/prompts.ts`
- **What**: When user asks about a specific wine type/region in general mode AND geolocation is available, show a discovery card: "3 ristoranti WYN vicino a te hanno questo vino". Uses existing `/api/venues/nearby` endpoint + cross-reference with wine embeddings. Card appears below AI response (UI element, not LLM output).
- **Depends on**: Phase 1 (RAG for wine search across venues)
- **Validation**: Ask "Dove bevo un Barolo a Roma?" → shows nearby WYN venues with Barolo in their list

### Task 43: Contextual CTA in general mode
- **Files**: Modify `components/chat/ChatMessage.tsx`
- **What**: Subtle, non-intrusive CTAs after general mode responses. Show every 3rd message (not every one). Variants:
  - "Sei al ristorante? Scannerizza il QR" → opens scanner
  - "Scopri ristoranti WYN vicino a te" → opens venue discovery
  - CTA is a UI element, NOT part of LLM prompt (zero token cost)
- **Depends on**: Nothing
- **Validation**: CTA appears every 3rd message in general mode; never in venue mode

### Phase 7 Validation Checklist
- [ ] Label scan accessible from chat input (camera icon)
- [ ] Scan results appear as chat message
- [ ] Venue discovery card shows when relevant
- [ ] CTA rotation works (every 3rd message)
- [ ] None of these features cost extra LLM tokens
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass

---

## Cost Summary

| Phase | One-Time | Monthly (10K users) |
|-------|----------|---------------------|
| 1. RAG | ~$5 (backfill embeddings) | ~$0.10 (query embeddings) |
| 2. Knowledge | ~$10 (generate for existing) | ~$1 (new wines) |
| 3. Memory | $0 | ~$12 (extraction LLM) |
| 4. Widget | $0 | $0 (same infra) |
| 5. API | $0 | $0 (passed to consumers) |
| **TOTAL** | **~$15** | **~$13/month** |

Current cost (full context, 10K users): ~$150/month. **RAG saves ~$137/month (91%).**

---

## New Environment Variables

```env
# Existing (already required)
OPENAI_API_KEY=sk-...          # Now also used for embeddings

# New (Phase 4+)
WIDGET_BASE_URL=https://app.wyn.wine
```

No other new env vars needed. Embedding uses existing OPENAI_API_KEY. Widget config stored in DB.

---

## Strategic Decision: General Mode = Vertical Wine App

**Decision: General mode is NOT a chatbot. It's a vertical wine app.** No rate limits.

Why a user chooses WYN over ChatGPT:

| Feature | ChatGPT | WYN |
|---------|---------|-----|
| Generic wine Q&A | Yes | Yes (same) |
| Remembers your preferences | No | **Yes (memory)** |
| Scan wine label → instant info | No | **Yes (vision)** |
| "Where to drink Barolo near me?" | No | **Yes (venue discovery)** |
| At restaurant: real wines, prices | No | **Yes (venue mode)** |
| Wine history across visits | No | **Yes (cross-venue memory)** |

Without memory + label scan + venue discovery, general mode is useless. WITH them, WYN is an indispensable wine companion app. This makes Phase 3 (Memory) a **critical priority**, and label scan / venue discovery must be activated.

---

## New Business Rules

```
RULE-008: Venues with >50 wines use RAG search; <=50 use full context
RULE-009: Memory extraction requires authenticated user with profiling_consent=true
RULE-010: Memory fragments decay 5%/month weight when not accessed for 30 days
RULE-011: Widget requests authenticated by widget API key, not Supabase session
RULE-012: Public API v1 requests scoped by key permissions (scopes[])
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
| 010 | `010_gdpr_memories.sql` | 3 | Update GDPR export for memories |
| 011 | `011_widget_configs.sql` | 4 | Widget config per venue |
| 012 | `012_api_keys.sql` | 5 | Public API key management |
| 013 | `013_api_usage.sql` | 5 | API usage tracking |
| 014 | `014_webhooks.sql` | 5 | Webhook config + delivery |

All migrations are **additive** (no destructive changes to existing tables).

---

## Implementation Order

```
Phase 1 (RAG):            Tasks 1-10   → Deploy → Validate
Phase 2 (Knowledge):      Tasks 11-16  → Deploy → Validate
Phase 3 (Memory):         Tasks 17-25  → Deploy → Validate  ← CRITICAL for app verticale
Phase 4 (Widget):         Tasks 26-32  → Deploy → Validate
Phase 5 (API+SDK):        Tasks 33-39  → Deploy → Validate
Phase 6 (CLAUDE.md):      Task 40      → Deploy → Validate
Phase 7 (Vertical App):   Tasks 41-43  → Deploy → Validate  ← Differenziatore vs ChatGPT
```

**Priority note:** Phase 7 tasks (label scan, venue discovery) can start in parallel with Phase 1-2 since Task 41 uses existing code. Task 42 depends on Phase 1 (RAG). Phase 3 (Memory) is the most critical differentiator - without it, general mode has no advantage over ChatGPT.

**Suggested parallel execution:**
- Sprint 1: Phase 1 (RAG) + Task 41 (label scan activation) + Task 43 (CTA)
- Sprint 2: Phase 2 (Knowledge) + Phase 3 start (memory schema + extraction)
- Sprint 3: Phase 3 complete (memory retrieval + GDPR) + Task 42 (venue discovery)
- Sprint 4: Phase 4 (Widget)
- Sprint 5: Phase 5 (API + SDK)
- Sprint 6: Phase 6 (CLAUDE.md update)

Each phase is independently deployable. The system remains fully functional after each phase deployment.

---

## Total Task Count: 43

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. RAG Foundation | 1-10 | pgvector, embeddings, semantic search, chat integration |
| 2. Deep Knowledge | 11-16 | Wine knowledge generation, admin review |
| 3. User Memory | 17-25 | Memory extraction, retrieval, decay, GDPR |
| 4. Widget | 26-32 | Embeddable chat widget, admin config |
| 5. API + SDK | 33-39 | Public REST API, API keys, webhooks, TypeScript SDK |
| 6. CLAUDE.md | 40 | Update documentation with v2 architecture |
| 7. Vertical App | 41-43 | Label scan, venue discovery, contextual CTA |
