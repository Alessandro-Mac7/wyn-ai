import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSuperAdmin } from '@/lib/supabase-auth-server'
import { syncEmbedding } from '@/lib/embedding-pipeline'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Verify user has permission to access/modify a wine
 * User must be owner of the venue OR super_admin
 */
async function verifyWineAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  wineId: string
): Promise<{ authorized: boolean; error?: string }> {
  // Fetch wine with venue info
  const { data: wine, error } = await supabase
    .from('wines')
    .select('id, venue_id, venues!inner(owner_id)')
    .eq('id', wineId)
    .single()

  if (error || !wine) {
    return { authorized: false, error: 'Vino non trovato' }
  }

  // Check if user is venue owner
  // TypeScript: venues is typed as array but Supabase returns object with !inner
  const venueData = wine.venues as unknown as { owner_id: string } | undefined
  const isOwner = venueData?.owner_id === userId

  // Check if user is super_admin
  const isSuperAdminUser = await isSuperAdmin(userId)

  if (!isOwner && !isSuperAdminUser) {
    return { authorized: false, error: 'Non autorizzato' }
  }

  return { authorized: true }
}

/**
 * POST /api/embeddings/sync
 * Sync embedding for a single wine (smart sync - only if content changed).
 *
 * Authorization: Venue owner OR super_admin
 * Request body: { wine_id: string }
 * Response: { success: boolean }
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`embeddings:sync:${clientId}`, RATE_LIMITS.enrichment)

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
    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'wine_id obbligatorio' },
        { status: 400 }
      )
    }

    // Verify authorization
    const { authorized, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wine_id
    )

    if (!authorized) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Vino non trovato' ? 404 : 403 }
      )
    }

    // Run smart sync
    console.log(`[API] Syncing embedding for wine ${wine_id}`)
    const success = await syncEmbedding(wine_id)

    if (!success) {
      return NextResponse.json(
        { error: 'Errore durante la sincronizzazione dell\'embedding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wine_id,
    })

  } catch (error) {
    console.error('[API] Error in POST /api/embeddings/sync:', error)
    return NextResponse.json(
      { error: 'Errore durante la sincronizzazione dell\'embedding' },
      { status: 500 }
    )
  }
}
