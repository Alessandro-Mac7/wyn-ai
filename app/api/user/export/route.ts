import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { UserDataExport } from '@/types/user'

// ============================================
// GET /api/user/export
// Export all user data (GDPR compliance)
// ============================================

export async function GET(request: NextRequest) {
  // Apply rate limiting for data export
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.export, 'export')
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

    // Use the database function for export
    const { data: exportData, error: exportError } = await supabase
      .rpc('export_user_data', { target_user_id: user.id })

    if (exportError) {
      console.error('Export error:', exportError)

      // Fallback: manual export if function fails
      return await manualExport(supabase, user.id)
    }

    // Add user email to export
    const result: UserDataExport = {
      ...exportData,
      email: user.email,
    }

    return NextResponse.json(result, {
      headers: {
        'Content-Disposition': `attachment; filename="wyn-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// Fallback manual export function
async function manualExport(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch chat sessions
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)

    // Fetch preferences
    const { data: preferences } = await supabase
      .from('inferred_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch wine scans
    const { data: wineScans } = await supabase
      .from('wine_scans')
      .select('*')
      .eq('user_id', userId)

    const result: UserDataExport = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile ?? ({} as Record<string, never>),
      chat_sessions: chatSessions ?? [],
      preferences: preferences ?? ({} as Record<string, never>),
      wine_scans: wineScans ?? [],
    }

    return NextResponse.json(result, {
      headers: {
        'Content-Disposition': `attachment; filename="wyn-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Manual export error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'esportazione' },
      { status: 500 }
    )
  }
}
