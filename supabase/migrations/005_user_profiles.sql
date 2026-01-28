-- ============================================
-- WYN - User Profiles Migration
-- Sistema profilo utente con storico chat e preferenze
-- ============================================

-- 1. Tabella profili utente
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  -- GDPR Consents
  gdpr_consent_at TIMESTAMP WITH TIME ZONE,
  profiling_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 2. Tabella sessioni chat (max 10 per utente)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  -- Session summary (no raw messages for privacy)
  summary JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  wines_mentioned TEXT[] DEFAULT '{}',
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_venue_id ON chat_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- 3. Tabella preferenze inferite (una riga per utente)
CREATE TABLE IF NOT EXISTS inferred_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Preferences JSONB structure:
  -- {
  --   wine_types: ['red', 'white'],
  --   taste_profile: { sweetness: 'dry', body: 'full' },
  --   price_range: { min: 20, max: 50 },
  --   regions: ['Toscana', 'Piemonte'],
  --   grapes: ['Nebbiolo', 'Sangiovese'],
  --   food_pairings: ['carne', 'formaggi']
  -- }
  preferences JSONB DEFAULT '{}'::jsonb,
  confidence FLOAT DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  sources TEXT[] DEFAULT '{}',
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX IF NOT EXISTS idx_inferred_preferences_user_id ON inferred_preferences(user_id);

-- 4. Tabella scan etichette
CREATE TABLE IF NOT EXISTS wine_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  -- Scan data
  extracted_data JSONB DEFAULT '{}'::jsonb,
  matched_wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  match_confidence FLOAT,
  -- Metadata
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per wine_scans
CREATE INDEX IF NOT EXISTS idx_wine_scans_user_id ON wine_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_scans_venue_id ON wine_scans(venue_id);
CREATE INDEX IF NOT EXISTS idx_wine_scans_scanned_at ON wine_scans(scanned_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at per user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Auto-update updated_at per chat_sessions
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Auto-update updated_at per inferred_preferences
CREATE OR REPLACE FUNCTION update_inferred_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inferred_preferences_updated_at
  BEFORE UPDATE ON inferred_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_inferred_preferences_updated_at();

-- Trigger per mantenere max 10 sessioni per utente
CREATE OR REPLACE FUNCTION enforce_max_chat_sessions()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
  oldest_session_id UUID;
BEGIN
  -- Conta sessioni esistenti per l'utente
  SELECT COUNT(*) INTO session_count
  FROM chat_sessions
  WHERE user_id = NEW.user_id;

  -- Se superiamo 10, elimina la piu vecchia
  IF session_count >= 10 THEN
    SELECT id INTO oldest_session_id
    FROM chat_sessions
    WHERE user_id = NEW.user_id
    ORDER BY created_at ASC
    LIMIT 1;

    DELETE FROM chat_sessions WHERE id = oldest_session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_chat_sessions
  BEFORE INSERT ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_chat_sessions();

-- Auto-create user_profile on first auth
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger su auth.users (se non esiste)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inferred_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_scans ENABLE ROW LEVEL SECURITY;

-- user_profiles: utente puo leggere/modificare solo il proprio profilo
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role per operazioni admin
CREATE POLICY "Service role manages profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- chat_sessions: utente puo vedere/creare solo le proprie sessioni
CREATE POLICY "Users can read own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role manages chat sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- inferred_preferences: utente puo vedere/cancellare le proprie preferenze
CREATE POLICY "Users can read own preferences" ON inferred_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON inferred_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Solo service_role puo inserire/aggiornare preferenze (via LLM analysis)
CREATE POLICY "Service role manages preferences" ON inferred_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- wine_scans: utente puo vedere i propri scan, chiunque puo inserire (anche anonimi)
CREATE POLICY "Users can read own scans" ON wine_scans
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert scans" ON wine_scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own scans" ON wine_scans
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role manages scans" ON wine_scans
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- GDPR EXPORT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  profile_data JSONB;
  sessions_data JSONB;
  preferences_data JSONB;
  scans_data JSONB;
BEGIN
  -- Verifica che l'utente stia richiedendo i propri dati
  IF auth.uid() != target_user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: can only export own data';
  END IF;

  -- Profilo
  SELECT to_jsonb(up.*) INTO profile_data
  FROM user_profiles up
  WHERE up.user_id = target_user_id;

  -- Sessioni chat
  SELECT COALESCE(jsonb_agg(to_jsonb(cs.*)), '[]'::jsonb) INTO sessions_data
  FROM chat_sessions cs
  WHERE cs.user_id = target_user_id;

  -- Preferenze
  SELECT to_jsonb(ip.*) INTO preferences_data
  FROM inferred_preferences ip
  WHERE ip.user_id = target_user_id;

  -- Scan
  SELECT COALESCE(jsonb_agg(to_jsonb(ws.*)), '[]'::jsonb) INTO scans_data
  FROM wine_scans ws
  WHERE ws.user_id = target_user_id;

  -- Componi risultato
  result = jsonb_build_object(
    'exported_at', NOW(),
    'user_id', target_user_id,
    'profile', COALESCE(profile_data, '{}'::jsonb),
    'chat_sessions', sessions_data,
    'preferences', COALESCE(preferences_data, '{}'::jsonb),
    'wine_scans', scans_data
  );

  RETURN result;
END;
$$;

-- ============================================
-- GDPR DELETE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica che l'utente stia cancellando i propri dati
  IF auth.uid() != target_user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own data';
  END IF;

  -- Elimina in ordine (FK constraints)
  DELETE FROM wine_scans WHERE user_id = target_user_id;
  DELETE FROM inferred_preferences WHERE user_id = target_user_id;
  DELETE FROM chat_sessions WHERE user_id = target_user_id;
  DELETE FROM user_profiles WHERE user_id = target_user_id;

  -- L'account auth.users verra eliminato separatamente via Supabase Admin API

  RETURN true;
END;
$$;

-- ============================================
-- COMMENTI
-- ============================================

COMMENT ON TABLE user_profiles IS 'Profili utente con consensi GDPR';
COMMENT ON TABLE chat_sessions IS 'Storico sessioni chat (max 10 per utente)';
COMMENT ON TABLE inferred_preferences IS 'Preferenze utente inferite da LLM';
COMMENT ON TABLE wine_scans IS 'Storico scan etichette vino';

COMMENT ON FUNCTION export_user_data IS 'Export dati utente per GDPR compliance';
COMMENT ON FUNCTION delete_user_data IS 'Cancella tutti i dati utente per GDPR compliance';
