# WYN - Embeddable Widget + Public API + SDK

> Piano separato, da implementare dopo il completamento di PLAN-PLATFORM-EVOLUTION-V2.
> Dipende da: Phase 1 (RAG), Phase 2 (Knowledge), Phase 3 (Memory) - tutte completate.

---

## Stato: DEFERRED

Priorita' inferiore rispetto alle feature verticali (label scan, venue discovery, CTA).
Da riprendere quando il prodotto core e' stabile e ci sono ristoratori che chiedono integrazione.

---

## Phase A: Embeddable Widget (ex Phase 4, Tasks 26-32)

Un widget chat che qualsiasi ristorante puo' integrare nel proprio sito con una riga di codice:

```html
<script src="https://wyn.app/widget/loader.js" data-venue="da-mario" data-key="wk_xxx"></script>
```

Il widget e' **solo venue mode**: ogni API key e' legata a un venue_id.

### Task 26: Create widget_configs table
- **Files**: `supabase/migrations/011_widget_configs.sql`
- **What**: Table: venue_id (unique), theme (JSONB: primaryColor, backgroundColor, textColor, fontFamily, borderRadius, position), welcome_message, placeholder_text, auto_open, auto_open_delay_seconds, show_powered_by, custom_logo_url, allowed_domains[], api_key (unique, auto-generated), enabled. RLS: venue owners manage own.

### Task 27: Create widget API endpoints
- **Files**: Create `app/api/widget/init/route.ts`, `app/api/widget/chat/route.ts`
- **What**: Auth by `X-Widget-Key` header (not Supabase session). Init returns venue info + config + welcome message. Chat uses same RAG/full-context logic as main chat API but authenticated by widget key. Widget-specific rate limits per API key.

### Task 28: Create widget embed page
- **Files**: Create `app/widget/embed/page.tsx`, `app/widget/embed/layout.tsx`
- **What**: Standalone page rendered inside iframe. Minimal layout (no sidebar, no nav). Reads config from parent via URL params or postMessage. Uses widget API endpoints.

### Task 29: Create widget chat components
- **Files**: Create `components/widget/WidgetChat.tsx`, `components/widget/WidgetMessage.tsx`, `components/widget/WidgetInput.tsx`
- **What**: Lightweight chat components optimized for small viewports and iframe. Similar to main chat UI but stripped down. Must work without auth context, sidebar, or venue selector.

### Task 30: Create loader script + postMessage bridge
- **Files**: Create `public/widget/loader.js`, create `lib/widget-bridge.ts`
- **What**: Loader (<5KB): reads data-venue and data-key from script tag, creates floating bubble button, creates iframe on click, sets up postMessage communication. Bridge: handles resize, open/close, theme updates between parent and iframe.

### Task 31: Widget configuration admin UI
- **Files**: Create `components/admin/WidgetConfigurator.tsx`, `components/admin/WidgetPreview.tsx`, `components/admin/EmbedCodeGenerator.tsx`
- **What**: Section in admin dashboard. Theme customizer with live preview. Domain allowlist. Copy embed code button. API key display (masked, revealable).

### Task 32: Add widget admin page/route
- **Files**: Create `app/admin/dashboard/widget/page.tsx` or add to existing dashboard
- **What**: Page that hosts the widget configurator components. Accessible from admin navigation.

---

## Phase B: Public API + SDK (ex Phase 5, Tasks 33-39)

API REST pubblica versioned (`/api/v1/*`) per integrazioni custom. Solo venue mode.

### Task 33: Create api_keys table
- **Files**: `supabase/migrations/012_api_keys.sql`
- **What**: Table: venue_id, key_hash (SHA-256), key_prefix (first 8 chars), name, scopes[] (chat, search, wines), rate_limit_per_minute, rate_limit_per_day, total_requests, last_used_at, enabled, expires_at.

### Task 34: API key auth middleware
- **Files**: Create `lib/api-auth.ts`
- **What**: `authenticateApiKey(request): Promise<{venue: Venue, scopes: string[]}>`. Validates `Authorization: Bearer wyn_k_xxx` header, checks key exists/enabled/not expired, verifies scopes, applies per-key rate limits, increments usage counter.

### Task 35: Public REST API v1 routes
- **Files**: Create `app/api/v1/chat/route.ts`, `app/api/v1/wines/route.ts`, `app/api/v1/wines/search/route.ts`, `app/api/v1/wines/[wineId]/route.ts`, `app/api/v1/venue/route.ts`
- **What**: All authenticated by API key. Chat: same RAG logic. Wines: list/search with pagination. Search: semantic search endpoint. Venue: venue info. Standard JSON responses with consistent error format.

### Task 36: Usage tracking
- **Files**: Create `supabase/migrations/013_api_usage.sql`, create `lib/api-usage.ts`
- **What**: `api_usage_daily` table: api_key_id, date, endpoint, request_count, token_count. Increment on each API call. Summary views for billing.

### Task 37: API key management UI
- **Files**: Create `app/api/admin/api-keys/route.ts`, create `components/admin/ApiKeyManager.tsx`
- **What**: CRUD for API keys. Admin can create (returns full key once), list (masked), revoke. Show usage stats per key.

### Task 38: Webhook system
- **Files**: Create `supabase/migrations/014_webhooks.sql`, create `lib/webhooks.ts`, create `app/api/admin/webhooks/route.ts`
- **What**: `webhooks` table: venue_id, url, events[], secret (HMAC), enabled. Events: wine.created/updated/deleted, chat.completed, recommendation.made. Delivery with retry (3 attempts). HMAC signature verification.

### Task 39: TypeScript SDK
- **Files**: Create `sdk/` directory: `sdk/src/index.ts`, `sdk/src/client.ts`, `sdk/src/types.ts`, `sdk/package.json`, `sdk/tsconfig.json`
- **What**: `WynClient({apiKey})` with methods: `chat(message, options?)`, `wines.list(options?)`, `wines.search(query, options?)`, `wines.get(id)`, `venue.info()`. Typed responses. Works in Node.js and browser.

---

## Migration Summary

| # | File | Phase | Description |
|---|------|-------|-------------|
| 011 | `011_widget_configs.sql` | A | Widget config per venue |
| 012 | `012_api_keys.sql` | B | Public API key management |
| 013 | `013_api_usage.sql` | B | API usage tracking |
| 014 | `014_webhooks.sql` | B | Webhook config + delivery |
