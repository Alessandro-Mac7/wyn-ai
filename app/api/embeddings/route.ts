import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSuperAdmin, isVenueOwner } from '@/lib/supabase-auth-server'
import { embedVenueWines } from '@/lib/embedding-pipeline'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/embeddings
 * Embed all wines for a specific venue.
 *
 * Authorization: Venue owner OR super_admin
 * Request body: { venue_id: string }
 * Response: { embedded, skipped, failed }
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`embeddings:${clientId}`, RATE_LIMITS.enrichment)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      { status: 429 }
    )
  }

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

    // Parse request body
    const { venue_id } = await request.json()

    if (!venue_id) {
      return NextResponse.json(
        { error: 'venue_id obbligatorio' },
        { status: 400 }
      )
    }

    // Verify authorization: must be venue owner OR super_admin
    const isSuperAdminUser = await isSuperAdmin(user.id)
    const isOwner = await isVenueOwner(user.id, venue_id)

    if (!isSuperAdminUser && !isOwner) {
      return NextResponse.json(
        { error: 'Accesso negato. Non sei autorizzato per questo locale.' },
        { status: 403 }
      )
    }

    // Verify venue exists
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venue_id)
      .single()

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Locale non trovato' },
        { status: 404 }
      )
    }

    // Run embedding pipeline
    console.log(`[API] Starting venue embedding for ${venue_id} (${venue.name})`)
    const stats = await embedVenueWines(venue_id)

    return NextResponse.json({
      success: true,
      venue_id,
      venue_name: venue.name,
      embedded: stats.embedded,
      skipped: stats.skipped,
      failed: stats.failed,
      total: stats.embedded + stats.skipped + stats.failed,
    })

  } catch (error) {
    console.error('[API] Error in POST /api/embeddings:', error)
    return NextResponse.json(
      { error: 'Errore durante la generazione degli embeddings' },
      { status: 500 }
    )
  }
}
