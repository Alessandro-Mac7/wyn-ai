import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================
// SUPABASE SERVER CLIENTS
// ============================================

// Admin client (server-side only, uses service role key)
// NEVER expose this to client-side code
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Server client (for API routes and server components)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )
}

// ============================================
// ROLE VERIFICATION FUNCTIONS
// ============================================

// Check if user is super_admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single()

  if (error) {
    console.error('Error checking super_admin role:', error)
    return false
  }

  return !!data
}

// Check if user is venue_admin
export async function isVenueAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'venue_admin')
    .single()

  if (error) {
    // Log error for debugging - distinguish between "not found" and actual errors
    if (error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - expected when user is not admin
      console.error('Error checking venue admin status:', error.code, error.message)
    }
    return false
  }

  return !!data
}

// Check if user owns a specific venue
export async function isVenueOwner(userId: string, venueId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('venues')
    .select('id')
    .eq('id', venueId)
    .eq('owner_id', userId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

// Get venue owned by user
export async function getVenueByOwner(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('venues')
    .select('id, slug, name, description, email')
    .eq('owner_id', userId)
    .single()

  if (error) {
    console.error('Error getting venue by owner:', error)
    return null
  }

  return data
}

// ============================================
// USER MANAGEMENT (Admin functions)
// ============================================

// Create a new venue with its admin user
export async function createVenueWithAdmin(params: {
  name: string
  slug: string
  email: string
  password: string
  description?: string
}): Promise<{ success: boolean; venue?: { id: string; slug: string; name: string }; error?: string }> {
  const { name, slug, email, password, description } = params

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user' }
    }

    const userId = authData.user.id

    // 2. Assign venue_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'venue_admin' })

    if (roleError) {
      // Rollback: delete user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: roleError.message }
    }

    // 3. Create venue linked to user
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .insert({
        name,
        slug,
        email,
        description: description || null,
        owner_id: userId
      })
      .select('id, slug, name')
      .single()

    if (venueError) {
      // Rollback: delete user and role
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: venueError.message }
    }

    return { success: true, venue }

  } catch (error) {
    console.error('Error creating venue with admin:', error)
    return { success: false, error: 'Unexpected error' }
  }
}
