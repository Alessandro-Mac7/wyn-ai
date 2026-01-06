-- ============================================
-- Migration: Add "recommended" column to wines
-- Feature: "Consigliato dal locale"
-- Date: 2025-01-05
-- ============================================

-- Add recommended column to wines table
ALTER TABLE wines ADD COLUMN IF NOT EXISTS recommended BOOLEAN DEFAULT false;

-- Create index for filtering recommended wines
CREATE INDEX IF NOT EXISTS idx_wines_recommended ON wines(venue_id, recommended);

-- ============================================
-- ROLLBACK (if needed):
-- DROP INDEX IF EXISTS idx_wines_recommended;
-- ALTER TABLE wines DROP COLUMN IF EXISTS recommended;
-- ============================================
