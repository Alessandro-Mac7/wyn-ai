import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin, isSuperAdmin } from '@/lib/supabase-auth-server'
import { embedVenueWines } from '@/lib/embedding-pipeline'

/**
 * POST /api/embeddings/backfill
 * Backfill embeddings for all venues in the system.
 * This is an admin-only operation that processes all venues sequentially.
 *
 * Authorization: super_admin only
 * Request body: none
 * Response: { total_venues, results: [{venue_id, venue_name, embedded, skipped, failed}] }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Verify super_admin role
    const isSuperAdminUser = await isSuperAdmin(user.id)

    if (!isSuperAdminUser) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo super admin può eseguire il backfill.' },
        { status: 403 }
      )
    }

    console.log('[API] Starting backfill for all venues')

    // Fetch all venues
    const { data: venues, error: venuesError } = await supabaseAdmin
      .from('venues')
      .select('id, name')
      .order('created_at', { ascending: true })

    if (venuesError) {
      console.error('[API] Error fetching venues:', venuesError)
      return NextResponse.json(
        { error: 'Errore nel recupero dei locali' },
        { status: 500 }
      )
    }

    if (!venues || venues.length === 0) {
      return NextResponse.json({
        success: true,
        total_venues: 0,
        results: [],
        message: 'Nessun locale trovato',
      })
    }

    console.log(`[API] Found ${venues.length} venues to process`)

    // Process each venue sequentially
    const results = []
    let totalEmbedded = 0
    let totalSkipped = 0
    let totalFailed = 0

    for (const venue of venues) {
      console.log(`[API] Processing venue ${venue.id} (${venue.name})`)

      try {
        const stats = await embedVenueWines(venue.id)

        results.push({
          venue_id: venue.id,
          venue_name: venue.name,
          embedded: stats.embedded,
          skipped: stats.skipped,
          failed: stats.failed,
          success: true,
        })

        totalEmbedded += stats.embedded
        totalSkipped += stats.skipped
        totalFailed += stats.failed

      } catch (error) {
        console.error(`[API] Error processing venue ${venue.id}:`, error)

        results.push({
          venue_id: venue.id,
          venue_name: venue.name,
          embedded: 0,
          skipped: 0,
          failed: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
        })
      }
    }

    console.log('[API] Backfill complete:', {
      total_venues: venues.length,
      total_embedded: totalEmbedded,
      total_skipped: totalSkipped,
      total_failed: totalFailed,
    })

    return NextResponse.json({
      success: true,
      total_venues: venues.length,
      total_embedded: totalEmbedded,
      total_skipped: totalSkipped,
      total_failed: totalFailed,
      results,
    })

  } catch (error) {
    console.error('[API] Error in POST /api/embeddings/backfill:', error)
    return NextResponse.json(
      { error: 'Errore durante il backfill degli embeddings' },
      { status: 500 }
    )
  }
}
