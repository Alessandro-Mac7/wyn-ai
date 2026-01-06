# PLAN-008: CSV Bulk Wine Upload & Paginated Wine List

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
| Created | 2026-01-05 |
| Type | feature |
| Priority | P1 |

---

## 1. Summary

This plan introduces two related features to improve wine management scalability:

1. **CSV Bulk Wine Upload**: Enable restaurant admins to upload multiple wines via CSV file, including validation, preview, progress tracking, and rollback capability.

2. **Paginated Wine List**: Replace the current "load all wines" approach with cursor-based pagination and server-side search to handle large wine catalogs efficiently.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CSV BULK UPLOAD FLOW                           │ │
│  │                                                                         │ │
│  │  ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────────────┐   │ │
│  │  │  Upload  │──►│  Parse &  │──►│  Preview │──►│  Bulk Insert     │   │ │
│  │  │  Dialog  │   │  Validate │   │  Modal   │   │  (Transaction)   │   │ │
│  │  └──────────┘   └───────────┘   └──────────┘   └──────────────────┘   │ │
│  │       │               │               │                │               │ │
│  │       │        Client-side      User confirms    POST /api/admin/     │ │
│  │       │         parsing           import         wines/bulk           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PAGINATION FLOW                                │ │
│  │                                                                         │ │
│  │  ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────────────┐   │ │
│  │  │  Initial │──►│   Scroll  │──►│  Search  │──►│  Filter Change   │   │ │
│  │  │   Load   │   │   Event   │   │  Input   │   │    Event         │   │ │
│  │  └──────────┘   └───────────┘   └──────────┘   └──────────────────┘   │ │
│  │       │               │               │                │               │ │
│  │       ▼               ▼               ▼                ▼               │ │
│  │  GET /wines?      GET /wines?    GET /wines?     GET /wines?          │ │
│  │  limit=50         cursor=X       search=Y        type=red             │ │
│  │  cursor=null      limit=50       limit=50        cursor=null          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Affected Files

| Area | Impact | Type |
|------|--------|------|
| `types/index.ts` | Add CSV, pagination, bulk import types | Modify |
| `lib/csv-parser.ts` | New client-side CSV parsing utility | Create |
| `lib/csv-validator.ts` | New validation logic for wine data | Create |
| `app/api/admin/wines/bulk/route.ts` | New bulk import endpoint | Create |
| `components/admin/CsvUploadDialog.tsx` | File upload UI | Create |
| `components/admin/CsvPreviewModal.tsx` | Preview parsed wines | Create |
| `hooks/usePaginatedWines.ts` | New hook for paginated data | Create |
| `hooks/useCsvUpload.ts` | New hook for CSV upload flow | Create |
| `app/admin/dashboard/page.tsx` | Integrate new features | Modify |

---

## 4. CSV Structure

### Mandatory Columns
| Column | Description | Validation |
|--------|-------------|------------|
| `name` | Wine name | Required, non-empty |
| `wine_type` | red, white, rose, sparkling, dessert | Required, must be valid type |
| `price` | Bottle price | Required, positive number |
| `producer` | Winery name | Required, non-empty |
| `year` | Vintage year | Required for red/white/rose/dessert |

### Optional Columns
| Column | Description |
|--------|-------------|
| `region` | Wine region |
| `denomination` | DOC, DOCG, IGT, etc. |
| `grape_varieties` | Comma-separated list |
| `description` | Tasting notes |
| `price_glass` | Glass price |

---

## 5. API Endpoints

### POST /api/admin/wines/bulk
**Request:**
```json
{
  "wines": [
    {
      "name": "Barolo Riserva",
      "wine_type": "red",
      "price": 85,
      "producer": "Giacomo Conterno",
      "year": 2018,
      "region": "Piemonte"
    }
  ]
}
```

**Response (201):**
```json
{
  "imported": 45,
  "failed": 2,
  "wines": [...],
  "errors": [
    { "index": 12, "name": "Invalid Wine", "error": "Missing producer" }
  ]
}
```

### GET /api/admin/wines (paginated)
**Query Parameters:**
- `limit` (default: 50, max: 100)
- `cursor` (base64 encoded cursor)
- `search` (full-text search)
- `wine_type` (filter by type)

**Response:**
```json
{
  "data": [...wines],
  "pagination": {
    "nextCursor": "eyJ2IjoiQmFyb2xvIiwiaWQiOiIxMjMifQ==",
    "hasMore": true,
    "total": 234
  }
}
```

---

## 6. Database Changes

```sql
-- Migration: 003_add_search_indexes.sql

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_wines_search ON wines
USING gin(to_tsvector('italian',
  coalesce(name, '') || ' ' ||
  coalesce(producer, '') || ' ' ||
  coalesce(region, '')
));

-- Pagination index
CREATE INDEX IF NOT EXISTS idx_wines_pagination
ON wines(venue_id, wine_type, name, id);
```

---

## 7. Implementation Phases

### Phase 1: Types and Utilities (Day 1)
- [ ] Add CSV types to `types/index.ts`
- [ ] Add pagination types to `types/index.ts`
- [ ] Create `lib/csv-parser.ts` (using PapaParse)
- [ ] Create `lib/csv-validator.ts`
- [ ] Write unit tests

### Phase 2: Backend (Day 2)
- [ ] Add paginated query to Supabase
- [ ] Create `POST /api/admin/wines/bulk`
- [ ] Add database migration for search index
- [ ] Write integration tests

### Phase 3: Frontend Hooks (Day 3)
- [ ] Create `hooks/usePaginatedWines.ts`
- [ ] Create `hooks/useCsvUpload.ts`
- [ ] Write hook tests

### Phase 4: Components (Day 4-5)
- [ ] Create `CsvUploadDialog.tsx`
- [ ] Create `CsvPreviewModal.tsx`
- [ ] Create infinite scroll in dashboard
- [ ] Write component tests

### Phase 5: Integration (Day 6)
- [ ] Update dashboard page
- [ ] Add CSV upload button
- [ ] Replace wine list with pagination
- [ ] Update search to server-side

### Phase 6: Testing & Polish (Day 7)
- [ ] E2E tests
- [ ] Performance testing
- [ ] Documentation

---

## 8. Dependencies

```bash
npm install papaparse @types/papaparse
```

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Large file DoS | 5MB file size limit |
| CSV injection | Escape special characters |
| Batch abuse | MAX_BATCH_SIZE = 100 |
| Unauthorized import | Supabase Auth + RLS |

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| CSV parse (1000 rows) | < 2s |
| Bulk insert (100 wines) | < 3s |
| Paginated query | < 500ms |
| Search query | < 500ms |
| Initial page load | < 1s |

---

## 11. Test Scenarios

### CSV Upload
1. Upload valid CSV → All wines imported
2. Upload CSV with errors → Preview shows errors, only valid imported
3. Upload empty CSV → Error message
4. Upload > 5MB file → Size limit error
5. Upload non-CSV file → File type error

### Pagination
1. Load page → First 50 wines shown
2. Scroll to bottom → Next 50 loaded
3. Search "Barolo" → Server-side search, reset list
4. Filter by "red" → Reset list, only red wines
5. 1000+ wines → Smooth infinite scroll

---

## 12. Handoff

Ready for:
- **AGENT_IMPLEMENTER_BE**: Backend (API, Supabase queries, migrations)
- **AGENT_IMPLEMENTER_FE**: Frontend (Components, hooks, dashboard integration)
- **AGENT_REVIEWER**: Validation and testing
