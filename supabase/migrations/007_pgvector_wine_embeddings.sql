-- ============================================
-- WYN - pgvector Wine Embeddings Migration
-- Enable semantic search for wine recommendations
-- ============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create wine_embeddings table
CREATE TABLE IF NOT EXISTS wine_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  content_text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  wine_type TEXT,
  price NUMERIC,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wine_id)
);

-- 3. Create HNSW index for fast similarity search
-- Using cosine distance for semantic similarity
CREATE INDEX IF NOT EXISTS wine_embeddings_embedding_idx
  ON wine_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- 4. Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_wine_embeddings_venue_id ON wine_embeddings(venue_id);
CREATE INDEX IF NOT EXISTS idx_wine_embeddings_wine_type ON wine_embeddings(wine_type);
CREATE INDEX IF NOT EXISTS idx_wine_embeddings_available ON wine_embeddings(available);
CREATE INDEX IF NOT EXISTS idx_wine_embeddings_price ON wine_embeddings(price);
CREATE INDEX IF NOT EXISTS idx_wine_embeddings_content_hash ON wine_embeddings(content_hash);

-- 5. Enable RLS on wine_embeddings
ALTER TABLE wine_embeddings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Public read access
CREATE POLICY "Wine embeddings read public" ON wine_embeddings
  FOR SELECT USING (true);

-- 7. RLS Policy: Service role write access
CREATE POLICY "Wine embeddings write service role" ON wine_embeddings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Wine embeddings update service role" ON wine_embeddings
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Wine embeddings delete service role" ON wine_embeddings
  FOR DELETE USING (auth.role() = 'service_role');

-- 8. Create match_wines() function for hybrid search
CREATE OR REPLACE FUNCTION match_wines(
  query_embedding vector(1536),
  match_venue_id uuid,
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 8,
  filter_available boolean DEFAULT true,
  filter_wine_type text DEFAULT NULL,
  filter_min_price numeric DEFAULT NULL,
  filter_max_price numeric DEFAULT NULL
)
RETURNS TABLE (
  wine_id uuid,
  venue_id uuid,
  content_text text,
  wine_type text,
  price numeric,
  available boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.wine_id,
    we.venue_id,
    we.content_text,
    we.wine_type,
    we.price,
    we.available,
    (1 - (we.embedding <=> query_embedding))::float AS similarity
  FROM wine_embeddings we
  WHERE
    we.venue_id = match_venue_id
    AND (filter_available = false OR we.available = true)
    AND (filter_wine_type IS NULL OR we.wine_type = filter_wine_type)
    AND (filter_min_price IS NULL OR we.price >= filter_min_price)
    AND (filter_max_price IS NULL OR we.price <= filter_max_price)
    AND (1 - (we.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 9. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wine_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wine_embeddings_updated_at
  BEFORE UPDATE ON wine_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_wine_embeddings_updated_at();

-- ============================================
-- NOTA: Dopo aver eseguito questa migrazione:
-- 1. Implementare servizio di generazione embeddings
-- 2. Popolare wine_embeddings per vini esistenti
-- 3. Aggiungere hook per generare embeddings su INSERT/UPDATE wines
-- ============================================
