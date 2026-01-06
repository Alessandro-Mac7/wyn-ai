-- ============================================
-- WYN Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);

-- ============================================
-- WINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  wine_type VARCHAR(20) NOT NULL CHECK (wine_type IN ('red', 'white', 'rose', 'sparkling', 'dessert')),
  price DECIMAL(10, 2) NOT NULL,
  price_glass DECIMAL(10, 2),
  producer VARCHAR(255),
  region VARCHAR(255),
  denomination VARCHAR(255),
  grape_varieties TEXT[],
  year INTEGER,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wines_venue ON wines(venue_id);
CREATE INDEX IF NOT EXISTS idx_wines_available ON wines(venue_id, available);
CREATE INDEX IF NOT EXISTS idx_wines_type ON wines(venue_id, wine_type);

-- ============================================
-- WINE RATINGS TABLE (Enrichment Data)
-- ============================================
CREATE TABLE IF NOT EXISTS wine_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  guide_id VARCHAR(50) NOT NULL,
  guide_name VARCHAR(100) NOT NULL,
  score VARCHAR(50) NOT NULL,
  confidence DECIMAL(3, 2) DEFAULT 0.5,
  year INTEGER,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wine lookups
CREATE INDEX IF NOT EXISTS idx_ratings_wine ON wine_ratings(wine_id);

-- ============================================
-- ENRICHMENT JOBS TABLE (Async Processing)
-- ============================================
CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for pending jobs
CREATE INDEX IF NOT EXISTS idx_jobs_status ON enrichment_jobs(status);

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

-- Apply trigger to venues
DROP TRIGGER IF EXISTS venues_updated_at ON venues;
CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply trigger to wines
DROP TRIGGER IF EXISTS wines_updated_at ON wines;
CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public venues read" ON venues;
DROP POLICY IF EXISTS "Public wines read" ON wines;
DROP POLICY IF EXISTS "Anon full access venues" ON venues;
DROP POLICY IF EXISTS "Anon full access wines" ON wines;
DROP POLICY IF EXISTS "Anon full access ratings" ON wine_ratings;
DROP POLICY IF EXISTS "Anon full access jobs" ON enrichment_jobs;

-- Allow all operations with anon key for MVP
-- (In production, implement proper RLS with JWT claims)
CREATE POLICY "Anon full access venues" ON venues FOR ALL USING (true);
CREATE POLICY "Anon full access wines" ON wines FOR ALL USING (true);
CREATE POLICY "Anon full access ratings" ON wine_ratings FOR ALL USING (true);
CREATE POLICY "Anon full access jobs" ON enrichment_jobs FOR ALL USING (true);

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
