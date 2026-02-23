-- ============================================
-- WYN - Wine Knowledge Migration
-- Deep wine knowledge storage for enriched sommelier recommendations
-- ============================================

-- 1. Create wine_knowledge table
CREATE TABLE IF NOT EXISTS wine_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL UNIQUE REFERENCES wines(id) ON DELETE CASCADE,

  -- Producer information
  producer_history TEXT,
  producer_philosophy TEXT,

  -- Terroir and vineyard
  terroir_description TEXT,
  vineyard_details TEXT,
  soil_type TEXT,
  climate TEXT,

  -- Vinification and aging
  vinification_process TEXT,
  aging_method TEXT,
  aging_duration TEXT,

  -- Vintage information
  vintage_notes TEXT,
  vintage_quality TEXT CHECK (
    vintage_quality IS NULL OR
    vintage_quality IN ('eccellente', 'ottima', 'buona', 'media', 'scarsa')
  ),

  -- Food pairing (structured as JSONB)
  -- Format: [{category: string, dishes: string[], match: string, notes: string}]
  food_pairings JSONB,

  -- Service recommendations
  serving_temperature TEXT,
  decanting_time TEXT,
  glass_type TEXT,

  -- Cultural and historical context
  anecdotes TEXT,
  curiosities TEXT[],

  -- Metadata
  knowledge_version INTEGER DEFAULT 1,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
-- wine_id already has unique constraint, which creates an index
CREATE INDEX IF NOT EXISTS idx_wine_knowledge_reviewed_at ON wine_knowledge(reviewed_at);

-- 3. Enable RLS on wine_knowledge
ALTER TABLE wine_knowledge ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Public read access
CREATE POLICY "Wine knowledge read public" ON wine_knowledge
  FOR SELECT USING (true);

-- 5. RLS Policy: Service role write access
CREATE POLICY "Wine knowledge write service role" ON wine_knowledge
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Wine knowledge update service role" ON wine_knowledge
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Wine knowledge delete service role" ON wine_knowledge
  FOR DELETE USING (auth.role() = 'service_role');

-- 6. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wine_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wine_knowledge_updated_at
  BEFORE UPDATE ON wine_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_wine_knowledge_updated_at();

-- ============================================
-- NOTA: Dopo aver eseguito questa migrazione:
-- 1. Implementare servizio di generazione wine_knowledge via LLM
-- 2. Popolare wine_knowledge per vini esistenti (graduale)
-- 3. Aggiungere logica per utilizzare questi dati nelle raccomandazioni
-- 4. Implementare processo di review per validare le informazioni
-- ============================================
