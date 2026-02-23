-- ============================================
-- WYN - Memory Fragments Migration
-- User memory system for personalized recommendations
-- ============================================

-- 1. Ensure pgvector extension is enabled
-- (already enabled in 007_pgvector_wine_embeddings.sql, but safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create memory_fragments table
CREATE TABLE IF NOT EXISTS memory_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragment_type TEXT NOT NULL CHECK (
    fragment_type IN ('preference', 'purchase', 'feedback', 'context', 'dislike', 'occasion')
  ),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  weight FLOAT NOT NULL DEFAULT 1.0 CHECK (weight >= 0.0 AND weight <= 1.0),
  last_relevant_at TIMESTAMPTZ DEFAULT now(),
  source_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  source_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create HNSW index for fast semantic similarity search
-- Using cosine distance for semantic similarity (same as wine_embeddings)
CREATE INDEX IF NOT EXISTS memory_fragments_embedding_idx
  ON memory_fragments
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Create additional indexes for filtering and performance
CREATE INDEX IF NOT EXISTS idx_memory_fragments_user_id ON memory_fragments(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_fragments_fragment_type ON memory_fragments(fragment_type);
CREATE INDEX IF NOT EXISTS idx_memory_fragments_last_relevant_at ON memory_fragments(last_relevant_at);

-- 5. Enable RLS on memory_fragments (memories are private!)
ALTER TABLE memory_fragments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Users can read their own memories
CREATE POLICY "Users can read own memories" ON memory_fragments
  FOR SELECT USING (auth.uid() = user_id);

-- 7. RLS Policy: Users can delete their own memories
CREATE POLICY "Users can delete own memories" ON memory_fragments
  FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS Policy: Service role can do everything (for AI operations)
CREATE POLICY "Service role manages memories" ON memory_fragments
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Create generic auto-update function for updated_at
-- (reusable for future tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-update updated_at timestamp
CREATE TRIGGER update_memory_fragments_updated_at
  BEFORE UPDATE ON memory_fragments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Create match_memories() function for semantic search over user memories
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding TEXT,
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.4,
  match_count INT DEFAULT 5,
  filter_fragment_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  fragment_id UUID,
  user_id UUID,
  fragment_type TEXT,
  content TEXT,
  metadata JSONB,
  weight FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vec vector(1536);
BEGIN
  -- Parse JSON string to vector
  query_vec := query_embedding::vector(1536);

  RETURN QUERY
  SELECT
    mf.id AS fragment_id,
    mf.user_id,
    mf.fragment_type,
    mf.content,
    mf.metadata,
    mf.weight,
    ((1 - (mf.embedding <=> query_vec)) * mf.weight)::float AS similarity
  FROM memory_fragments mf
  WHERE
    mf.user_id = match_user_id
    AND mf.embedding IS NOT NULL
    AND (filter_fragment_type IS NULL OR mf.fragment_type = filter_fragment_type)
    AND (1 - (mf.embedding <=> query_vec)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 12. Create decay_memory_weights() function for stale memory management
CREATE OR REPLACE FUNCTION decay_memory_weights(
  decay_factor FLOAT DEFAULT 0.05,
  stale_days INT DEFAULT 30,
  min_weight FLOAT DEFAULT 0.1
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE memory_fragments
  SET weight = GREATEST(weight - decay_factor, min_weight)
  WHERE last_relevant_at < now() - (stale_days || ' days')::interval
    AND weight > min_weight;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 13. Add table and function comments
COMMENT ON TABLE memory_fragments IS 'User memory fragments for personalized AI recommendations';
COMMENT ON COLUMN memory_fragments.fragment_type IS 'Type: preference, purchase, feedback, context, dislike, occasion';
COMMENT ON COLUMN memory_fragments.weight IS 'Relevance weight (0.0-1.0), decays over time';
COMMENT ON COLUMN memory_fragments.last_relevant_at IS 'Last time this memory was relevant in a conversation';
COMMENT ON COLUMN memory_fragments.embedding IS 'pgvector embedding for semantic similarity search';

COMMENT ON FUNCTION match_memories IS 'Semantic search over user memories with weight adjustment';
COMMENT ON FUNCTION decay_memory_weights IS 'Decay weights of stale memories to reduce their influence';
COMMENT ON FUNCTION update_updated_at_column IS 'Generic trigger function to auto-update updated_at timestamp';

-- ============================================
-- NOTA: Dopo aver eseguito questa migrazione:
-- 1. Implementare servizio per estrarre memory fragments dalle conversazioni
-- 2. Implementare generazione embeddings per i fragments
-- 3. Schedulare job periodico per decay_memory_weights()
-- 4. Integrare match_memories() nel prompt context assembly
-- ============================================
