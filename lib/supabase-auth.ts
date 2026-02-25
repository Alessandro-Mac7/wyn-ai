import { createBrowserClient } from '@supabase/ssr'

// ============================================
// SUPABASE BROWSER CLIENT
// ============================================

// Browser client (client-side)
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow to avoid PKCE issues when user opens
        // magic link in a different browser/device
        flowType: 'implicit',
      },
    }
  )
}

// ============================================
// OTP AUTHENTICATION
// ============================================

export interface OtpResult {
  success: boolean
  error?: string
}

export interface OtpVerifyResult {
  success: boolean
  isNewUser: boolean
  error?: string
}

/**
 * Send a 6-digit OTP code via email (no redirect URL = code mode)
 *
 * Supabase sends a numeric code when signInWithOtp is called WITHOUT emailRedirectTo.
 * The user enters the code in-app → verifyOtpCode() creates the session.
 */
export async function sendOtpCode(email: string): Promise<OtpResult> {
  const supabase = createSupabaseBrowserClient()

  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth] Sending OTP code to:', email)
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
  })

  if (error) {
    console.error('OTP send error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Verify the 6-digit OTP code and establish session
 *
 * Returns isNewUser to allow redirect to onboarding page.
 */
export async function verifyOtpCode(email: string, token: string): Promise<OtpVerifyResult> {
  const supabase = createSupabaseBrowserClient()

  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth] Verifying OTP for:', email)
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    console.error('OTP verify error:', error)
    return { success: false, isNewUser: false, error: error.message }
  }

  // Detect new user: created_at equals last_sign_in_at (first login)
  const user = data.user
  const isNewUser = user
    ? user.created_at === user.last_sign_in_at
    : false

  return { success: true, isNewUser }
}

// ============================================
// MAGIC LINK AUTHENTICATION (backward compat)
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
 * Build the auth callback URL
 *
 * Priority:
 * 1. Explicit redirectTo parameter
 * 2. NEXT_PUBLIC_APP_URL environment variable
 * 3. window.location.origin (fallback)
 *
 * IMPORTANT: The redirect URL MUST be whitelisted in Supabase Dashboard:
 * Authentication → URL Configuration → Redirect URLs
 */
function buildAuthCallbackUrl(redirectTo?: string): string {
  if (redirectTo) {
    return redirectTo
  }

  // Use explicit app URL if configured (recommended for production)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && appUrl !== 'http://localhost:3000') {
    return `${appUrl}/auth/callback`
  }

  // Fallback to current origin
  return `${window.location.origin}/auth/callback`
}

/**
 * Send magic link email for passwordless authentication
 *
 * NOTE: For this to work correctly, you must configure Supabase Dashboard:
 * 1. Set "Site URL" to your production domain
 * 2. Add callback URLs to "Redirect URLs" whitelist
 */
export async function signInWithMagicLink(options: MagicLinkOptions): Promise<MagicLinkResult> {
  const supabase = createSupabaseBrowserClient()

  const redirectTo = buildAuthCallbackUrl(options.redirectTo)

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth] Magic link redirect URL:', redirectTo)
  }

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
