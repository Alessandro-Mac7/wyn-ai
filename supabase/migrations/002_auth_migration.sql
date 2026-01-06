-- ============================================
-- WYN - Auth Migration
-- Migrazione a Supabase Auth per autenticazione sicura
-- ============================================

-- 1. Tabella ruoli utente
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'venue_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Indice per lookup veloci
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 2. Modifica tabella venues: aggiungi owner_id
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Indice per owner
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);

-- 3. Abilita RLS su user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Policy per user_roles
-- Solo super_admin può leggere tutti i ruoli
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Solo service_role può inserire/modificare ruoli
CREATE POLICY "Service role manages roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Rimuovi vecchie policy permissive su venues
DROP POLICY IF EXISTS "Anon full access venues" ON venues;

-- 6. Nuove policy venues
-- Lettura pubblica (per chat utenti)
CREATE POLICY "Venues read public" ON venues
  FOR SELECT USING (true);

-- Scrittura solo per owner o super_admin
CREATE POLICY "Venues write owner or super_admin" ON venues
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Venues update owner or super_admin" ON venues
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Venues delete owner or super_admin" ON venues
  FOR DELETE USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7. Rimuovi vecchie policy permissive su wines
DROP POLICY IF EXISTS "Anon full access wines" ON wines;

-- 8. Nuove policy wines
-- Lettura pubblica (per chat utenti)
CREATE POLICY "Wines read public" ON wines
  FOR SELECT USING (true);

-- Scrittura solo per owner del venue o super_admin
CREATE POLICY "Wines write venue owner or super_admin" ON wines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = wines.venue_id
      AND (
        venues.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      )
    )
  );

CREATE POLICY "Wines update venue owner or super_admin" ON wines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = wines.venue_id
      AND (
        venues.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      )
    )
  );

CREATE POLICY "Wines delete venue owner or super_admin" ON wines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = wines.venue_id
      AND (
        venues.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      )
    )
  );

-- 9. Policy per wine_ratings (lettura pubblica, scrittura service_role)
DROP POLICY IF EXISTS "Anon full access wine_ratings" ON wine_ratings;

CREATE POLICY "Wine ratings read public" ON wine_ratings
  FOR SELECT USING (true);

CREATE POLICY "Wine ratings write service role" ON wine_ratings
  FOR ALL USING (auth.role() = 'service_role');

-- 10. Policy per enrichment_jobs (service_role only)
DROP POLICY IF EXISTS "Anon full access enrichment_jobs" ON enrichment_jobs;

CREATE POLICY "Enrichment jobs service role" ON enrichment_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- NOTA: Dopo aver eseguito questa migrazione:
-- 1. Rimuovere manualmente la colonna password_hash se esiste:
--    ALTER TABLE venues DROP COLUMN IF EXISTS password_hash;
-- 2. Creare il primo super_admin manualmente via Supabase Dashboard
-- ============================================
