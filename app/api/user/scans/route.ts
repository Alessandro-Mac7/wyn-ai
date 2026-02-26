import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { SCAN_HISTORY_LIMIT } from '@/config/constants'

// ============================================
// GET /api/user/scans
// List user's scan history
// ============================================

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const { data: scans, error } = await supabase
      .from('wine_scans')
      .select('id, user_id, venue_id, extracted_data, matched_wine_id, match_confidence, scanned_at, created_at')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(SCAN_HISTORY_LIMIT)

    if (error) {
      console.error('Scans fetch error:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero delle scansioni' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scans: scans || [] })
  } catch (error) {
    console.error('Scans GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/user/scans
// Delete specific or all scans
// ============================================

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.general, 'scans')
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

    const body = await request.json()
    const { scan_id, delete_all } = body as { scan_id?: string; delete_all?: boolean }

    if (!scan_id && !delete_all) {
      return NextResponse.json(
        { error: 'Specificare scan_id o delete_all' },
        { status: 400 }
      )
    }

    let deletedCount = 0

    if (delete_all) {
      const { data, error } = await supabase
        .from('wine_scans')
        .delete()
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        console.error('Delete all scans error:', error)
        return NextResponse.json(
          { error: 'Errore nella cancellazione delle scansioni' },
          { status: 500 }
        )
      }
      deletedCount = data?.length || 0
    } else if (scan_id) {
      const { data, error } = await supabase
        .from('wine_scans')
        .delete()
        .eq('id', scan_id)
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        console.error('Delete scan error:', error)
        return NextResponse.json(
          { error: 'Errore nella cancellazione della scansione' },
          { status: 500 }
        )
      }
      deletedCount = data?.length || 0
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
    })
  } catch (error) {
    console.error('Scans DELETE error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
