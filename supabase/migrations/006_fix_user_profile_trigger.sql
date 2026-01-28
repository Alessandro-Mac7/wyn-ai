-- ============================================
-- FIX: User Profile Trigger RLS Bypass
-- Run this in Supabase SQL Editor if you get
-- "Database error saving new user" on magic link login
-- ============================================

-- Fix: Modifica la policy per permettere al trigger di inserire
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Allow profile creation" ON user_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IS NULL
  );

-- Ricrea il trigger con error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile_on_signup();

CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();
