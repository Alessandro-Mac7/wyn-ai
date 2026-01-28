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

// ============================================
// MAGIC LINK AUTHENTICATION
// ============================================

export interface MagicLinkOptions {
  email: string
  redirectTo?: string
}

export interface MagicLinkResult {
  success: boolean
  error?: string
}

/**
 * Send magic link email for passwordless authentication
 */
export async function signInWithMagicLink(options: MagicLinkOptions): Promise<MagicLinkResult> {
  const supabase = createSupabaseBrowserClient()

  const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email: options.email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    console.error('Magic link error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowserClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: { id: string; email?: string } | null) => void) {
  const supabase = createSupabaseBrowserClient()

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })

  return subscription
}
