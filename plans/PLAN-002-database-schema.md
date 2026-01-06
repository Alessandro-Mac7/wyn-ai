# PLAN-002: Database Schema & Supabase Setup

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
| Priority | P0 |
| Dependencies | PLAN-001 (completed) |

---

## 1. Summary

Set up the Supabase database schema for WYN, including tables for venues, wines, and enrichment data. This is the foundation for all data operations.

---

## 2. Goals

- Create Supabase project and configure connection
- Define database schema matching domain model
- Set up Row Level Security (RLS) policies
- Create seed data for development
- Document schema for team reference

---

## 3. Non-Goals

- User authentication system (future iteration)
- Full-text search optimization (future)
- Analytics/reporting tables (future)

---

## 4. Affected Areas

| Area | Impact |
|------|--------|
| `.env.local` | Add Supabase credentials |
| `lib/supabase.ts` | Configure client |
| `types/index.ts` | Align with DB schema |
| Supabase Dashboard | Create tables, policies |

---

## 5. Technical Design

### 5.1 Database Schema

```sql
-- ============================================
-- WYN Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  password_hash VARCHAR(255), -- Simple auth for MVP
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_venues_slug ON venues(slug);

-- ============================================
-- WINES TABLE
-- ============================================
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  wine_type VARCHAR(20) NOT NULL CHECK (wine_type IN ('red', 'white', 'rose', 'sparkling', 'dessert')),
  price DECIMAL(10, 2) NOT NULL,
  price_glass DECIMAL(10, 2),
  producer VARCHAR(255),
  region VARCHAR(255),
  denomination VARCHAR(255),
  grape_varieties TEXT[], -- Array of grape names
  year INTEGER,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wines_venue ON wines(venue_id);
CREATE INDEX idx_wines_available ON wines(venue_id, available);
CREATE INDEX idx_wines_type ON wines(venue_id, wine_type);

-- ============================================
-- WINE RATINGS TABLE (Enrichment Data)
-- ============================================
CREATE TABLE wine_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  guide_id VARCHAR(50) NOT NULL, -- e.g., 'gambero-rosso', 'wine-spectator'
  guide_name VARCHAR(100) NOT NULL,
  score VARCHAR(50) NOT NULL, -- Flexible: "95", "Tre Bicchieri", etc.
  confidence DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  year INTEGER,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wine lookups
CREATE INDEX idx_ratings_wine ON wine_ratings(wine_id);

-- ============================================
-- ENRICHMENT JOBS TABLE (Async Processing)
-- ============================================
CREATE TABLE enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for pending jobs
CREATE INDEX idx_jobs_status ON enrichment_jobs(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.2 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for venues (by slug)
CREATE POLICY "Public venues read" ON venues
  FOR SELECT USING (true);

-- Public read access for available wines
CREATE POLICY "Public wines read" ON wines
  FOR SELECT USING (available = true);

-- Admin full access (authenticated by venue_id in JWT)
-- Note: For MVP, we'll use anon key with service role for admin ops

-- Allow all operations with anon key for MVP
CREATE POLICY "Anon full access venues" ON venues
  FOR ALL USING (true);

CREATE POLICY "Anon full access wines" ON wines
  FOR ALL USING (true);

CREATE POLICY "Anon full access ratings" ON wine_ratings
  FOR ALL USING (true);

CREATE POLICY "Anon full access jobs" ON enrichment_jobs
  FOR ALL USING (true);
```

### 5.3 Seed Data

```sql
-- ============================================
-- SEED DATA FOR DEVELOPMENT
-- ============================================

-- Demo Venue
INSERT INTO venues (slug, name, description, email, password_hash) VALUES
(
  'osteria-del-vino',
  'Osteria del Vino',
  'Ristorante tradizionale italiano con ampia selezione di vini locali',
  'admin@osteria.com',
  'demo' -- Plain text for MVP demo
);

-- Get venue ID for wines
DO $$
DECLARE
  venue_id UUID;
BEGIN
  SELECT id INTO venue_id FROM venues WHERE slug = 'osteria-del-vino';

  -- Insert wines
  INSERT INTO wines (venue_id, name, wine_type, price, price_glass, producer, region, denomination, grape_varieties, year, description, available) VALUES
  (venue_id, 'Barolo Riserva 2018', 'red', 85.00, 18.00, 'Cascina Francia', 'Piemonte', 'Barolo DOCG', ARRAY['Nebbiolo'], 2018, 'Nebbiolo corposo con note di catrame, rose e ciliegie essiccate', true),
  (venue_id, 'Brunello di Montalcino 2019', 'red', 95.00, 20.00, 'Biondi-Santi', 'Toscana', 'Brunello di Montalcino DOCG', ARRAY['Sangiovese Grosso'], 2019, 'Sangiovese Grosso al suo meglio, invecchiato 4 anni in rovere', true),
  (venue_id, 'Gavi di Gavi 2022', 'white', 42.00, 10.00, 'La Scolca', 'Piemonte', 'Gavi DOCG', ARRAY['Cortese'], 2022, 'Cortese fresco con note minerali e agrumi', true),
  (venue_id, 'Franciacorta Brut NV', 'sparkling', 58.00, 14.00, 'Ca'' del Bosco', 'Lombardia', 'Franciacorta DOCG', ARRAY['Chardonnay', 'Pinot Nero'], NULL, 'Spumante metodo classico, 36 mesi sui lieviti', true),
  (venue_id, 'Amarone della Valpolicella 2017', 'red', 120.00, NULL, 'Allegrini', 'Veneto', 'Amarone DOCG', ARRAY['Corvina', 'Rondinella', 'Molinara'], 2017, 'Ricco e vellutato, prodotto con uve Corvina appassite', false),
  (venue_id, 'Vermentino di Sardegna 2023', 'white', 32.00, 8.00, 'Argiolas', 'Sardegna', 'Vermentino di Sardegna DOC', ARRAY['Vermentino'], 2023, 'Luminoso e aromatico con carattere mediterraneo', true);

  -- Insert sample ratings
  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  SELECT w.id, 'wine-spectator', 'Wine Spectator', '95', 0.85, 2023
  FROM wines w WHERE w.name = 'Barolo Riserva 2018' AND w.venue_id = venue_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  SELECT w.id, 'robert-parker', 'Robert Parker', '97', 0.90, 2023
  FROM wines w WHERE w.name = 'Brunello di Montalcino 2019' AND w.venue_id = venue_id;

  INSERT INTO wine_ratings (wine_id, guide_id, guide_name, score, confidence, year)
  SELECT w.id, 'gambero-rosso', 'Gambero Rosso', 'Tre Bicchieri', 0.95, 2024
  FROM wines w WHERE w.name = 'Gavi di Gavi 2022' AND w.venue_id = venue_id;

END $$;
```

### 5.4 TypeScript Types Alignment

```typescript
// types/database.ts - Auto-generated types from Supabase
export interface Database {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          email: string | null
          password_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Venues['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Venues['Insert']>
      }
      wines: {
        Row: {
          id: string
          venue_id: string
          name: string
          wine_type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'
          price: number
          price_glass: number | null
          producer: string | null
          region: string | null
          denomination: string | null
          grape_varieties: string[] | null
          year: number | null
          description: string | null
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Wines['Row'], 'id' | 'created_at' | 'updated_at' | 'available'>
        Update: Partial<Wines['Insert']>
      }
      wine_ratings: {
        Row: {
          id: string
          wine_id: string
          guide_id: string
          guide_name: string
          score: string
          confidence: number
          year: number | null
          source_url: string | null
          created_at: string
        }
        Insert: Omit<WineRatings['Row'], 'id' | 'created_at'>
        Update: Partial<WineRatings['Insert']>
      }
    }
  }
}
```

---

## 6. Implementation Steps

1. [ ] Create Supabase project at supabase.com
2. [ ] Get project URL and anon key
3. [ ] Add credentials to `.env.local`
4. [ ] Run schema SQL in Supabase SQL Editor
5. [ ] Run RLS policies SQL
6. [ ] Run seed data SQL
7. [ ] Generate TypeScript types (optional: `npx supabase gen types`)
8. [ ] Update `lib/supabase.ts` to use typed client
9. [ ] Test connection with simple query
10. [ ] Verify seed data in Supabase dashboard

---

## 7. Test Strategy

- **Connection Test:** Simple SELECT from venues
- **CRUD Test:** Insert/Update/Delete wine
- **RLS Test:** Verify public can only read available wines
- **Seed Verification:** All 6 demo wines visible

---

## 8. Rollback Plan

1. Drop all tables: `DROP TABLE IF EXISTS wine_ratings, enrichment_jobs, wines, venues CASCADE;`
2. Remove environment variables
3. No data loss (fresh setup)

---

## 9. Review Checklist

- [ ] Schema matches domain model in CLAUDE.md
- [ ] All required fields present
- [ ] Indexes on frequently queried columns
- [ ] RLS policies allow required access patterns
- [ ] Seed data covers all wine types
- [ ] TypeScript types aligned

---

**This plan establishes the data foundation for all features.**
