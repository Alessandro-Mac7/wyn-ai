import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// ============================================
// DELETE /api/user/delete
// Delete user account and all data (GDPR compliance)
// ============================================

export async function DELETE(request: NextRequest) {
  // Apply strict rate limiting for account deletion
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.deleteAccount, 'delete')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const userId = user.id

    // First, try to use the database function
    const { error: deleteDataError } = await supabaseAdmin
      .rpc('delete_user_data', { target_user_id: userId })

    if (deleteDataError) {
      console.error('Delete data function error:', deleteDataError)

      // Fallback: manual deletion
      await manualDeleteUserData(userId)
    }

    // Delete the auth user (this requires admin client)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Delete auth user error:', deleteUserError)
      return NextResponse.json(
        { error: 'Errore nella cancellazione dell\'account. I dati sono stati eliminati ma l\'account rimane attivo. Contatta il supporto.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account e dati eliminati con successo',
    })

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// Manual deletion fallback
async function manualDeleteUserData(userId: string) {
  // Delete in order (respecting FK constraints)

  // 1. Delete wine scans
  const { error: scansError } = await supabaseAdmin
    .from('wine_scans')
    .delete()
    .eq('user_id', userId)

  if (scansError) {
    console.error('Delete wine_scans error:', scansError)
  }

  // 2. Delete inferred preferences
  const { error: prefsError } = await supabaseAdmin
    .from('inferred_preferences')
    .delete()
    .eq('user_id', userId)

  if (prefsError) {
    console.error('Delete inferred_preferences error:', prefsError)
  }

  // 3. Delete chat sessions
  const { error: sessionsError } = await supabaseAdmin
    .from('chat_sessions')
    .delete()
    .eq('user_id', userId)

  if (sessionsError) {
    console.error('Delete chat_sessions error:', sessionsError)
  }

  // 4. Delete user profile
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('user_id', userId)

  if (profileError) {
    console.error('Delete user_profiles error:', profileError)
  }

  // 5. Delete user roles (if any)
  const { error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)

  if (rolesError && rolesError.code !== 'PGRST116') {
    console.error('Delete user_roles error:', rolesError)
  }
}
