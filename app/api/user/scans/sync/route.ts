import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { SCAN_HISTORY_MAX_PER_USER } from '@/config/constants'
import type { WineScanData } from '@/types'

// ============================================
// POST /api/user/scans/sync
// Sync localStorage scans to DB after login
// ============================================

interface LocalScan {
  extracted_data: WineScanData
  venue_id: string | null
  matched_wine_id: string | null
  match_confidence: number | null
  scanned_at: string
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.general, 'scans-sync')
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
    const { scans } = body as { scans: LocalScan[] }

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({ synced: 0 })
    }

    // Limit to 5 scans max per sync
    const toSync = scans.slice(0, 5)

    const rows = toSync.map(scan => ({
      user_id: user.id,
      venue_id: scan.venue_id,
      extracted_data: scan.extracted_data,
      matched_wine_id: scan.matched_wine_id,
      match_confidence: scan.match_confidence,
      scanned_at: scan.scanned_at,
    }))

    const { error } = await supabaseAdmin
      .from('wine_scans')
      .insert(rows)

    if (error) {
      console.error('Scan sync insert error:', error)
      return NextResponse.json(
        { error: 'Errore nella sincronizzazione' },
        { status: 500 }
      )
    }

    // Cleanup oldest if over limit
    const { data: excess } = await supabaseAdmin
      .from('wine_scans')
      .select('id')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .range(SCAN_HISTORY_MAX_PER_USER, SCAN_HISTORY_MAX_PER_USER + 50)

    if (excess && excess.length > 0) {
      await supabaseAdmin
        .from('wine_scans')
        .delete()
        .in('id', excess.map(s => s.id))
    }

    return NextResponse.json({ synced: toSync.length })
  } catch (error) {
    console.error('Scans sync error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
