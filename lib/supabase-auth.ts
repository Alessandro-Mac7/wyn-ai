import { createBrowserClient } from '@supabase/ssr'

// ============================================
// SUPABASE BROWSER CLIENT
// ============================================

// Browser client (client-side)
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
