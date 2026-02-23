import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSuperAdmin, supabaseAdmin } from '@/lib/supabase-auth-server'
import { syncEmbedding } from '@/lib/embedding-pipeline'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { WineKnowledge, FoodPairingDetailed } from '@/types'

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
 * GET /api/admin/wines/[wineId]/knowledge
 * Fetch wine knowledge for admin review
 *
 * Authorization: Venue owner OR super_admin
 * Response: { knowledge: WineKnowledge | null }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { wineId: string } }
) {
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

    const { wineId } = params

    if (!wineId) {
      return NextResponse.json(
        { error: 'wineId obbligatorio' },
        { status: 400 }
      )
    }

    // Verify authorization
    const { authorized, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wineId
    )

    if (!authorized) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Vino non trovato' ? 404 : 403 }
      )
    }

    // Fetch wine knowledge
    const { data: knowledge, error: knowledgeError } = await supabaseAdmin
      .from('wine_knowledge')
      .select('*')
      .eq('wine_id', wineId)
      .single()

    // Return null if no knowledge exists (not an error)
    if (knowledgeError && knowledgeError.code === 'PGRST116') {
      return NextResponse.json({ knowledge: null })
    }

    if (knowledgeError) {
      console.error('[API] Error fetching wine knowledge:', knowledgeError)
      return NextResponse.json(
        { error: 'Errore nel recupero della conoscenza del vino' },
        { status: 500 }
      )
    }

    return NextResponse.json({ knowledge })

  } catch (error) {
    console.error('[API] Error in GET /api/admin/wines/[wineId]/knowledge:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della conoscenza del vino' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/wines/[wineId]/knowledge
 * Update/review wine knowledge
 *
 * Authorization: Venue owner OR super_admin
 * Request body: Partial WineKnowledge fields (excluding id, wine_id, created_at, updated_at)
 * Response: { success: true, knowledge: WineKnowledge }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { wineId: string } }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`knowledge:${clientId}`, RATE_LIMITS.enrichment)

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

    const { wineId } = params

    if (!wineId) {
      return NextResponse.json(
        { error: 'wineId obbligatorio' },
        { status: 400 }
      )
    }

    // Verify authorization
    const { authorized, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wineId
    )

    if (!authorized) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Vino non trovato' ? 404 : 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Extract knowledge fields (exclude metadata)
    const {
      producer_history,
      producer_philosophy,
      terroir_description,
      vineyard_details,
      soil_type,
      climate,
      vinification_process,
      aging_method,
      aging_duration,
      vintage_notes,
      vintage_quality,
      food_pairings,
      serving_temperature,
      decanting_time,
      glass_type,
      anecdotes,
      curiosities,
      knowledge_version,
    } = body

    // Validate vintage_quality if provided
    if (vintage_quality && !['eccellente', 'ottima', 'buona', 'media', 'scarsa'].includes(vintage_quality)) {
      return NextResponse.json(
        { error: 'vintage_quality non valido. Valori consentiti: eccellente, ottima, buona, media, scarsa' },
        { status: 400 }
      )
    }

    // Validate food_pairings if provided
    if (food_pairings && Array.isArray(food_pairings)) {
      for (const pairing of food_pairings) {
        if (!pairing.category || !Array.isArray(pairing.dishes) || !pairing.match) {
          return NextResponse.json(
            { error: 'food_pairings non valido. Ogni pairing deve avere category, dishes (array), e match' },
            { status: 400 }
          )
        }
        if (!['eccellente', 'ottimo', 'buono'].includes(pairing.match)) {
          return NextResponse.json(
            { error: 'match non valido in food_pairings. Valori consentiti: eccellente, ottimo, buono' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare upsert data
    const now = new Date().toISOString()
    const knowledgeData = {
      wine_id: wineId,
      producer_history: producer_history ?? null,
      producer_philosophy: producer_philosophy ?? null,
      terroir_description: terroir_description ?? null,
      vineyard_details: vineyard_details ?? null,
      soil_type: soil_type ?? null,
      climate: climate ?? null,
      vinification_process: vinification_process ?? null,
      aging_method: aging_method ?? null,
      aging_duration: aging_duration ?? null,
      vintage_notes: vintage_notes ?? null,
      vintage_quality: vintage_quality ?? null,
      food_pairings: food_pairings ?? null,
      serving_temperature: serving_temperature ?? null,
      decanting_time: decanting_time ?? null,
      glass_type: glass_type ?? null,
      anecdotes: anecdotes ?? null,
      curiosities: curiosities ?? null,
      knowledge_version: knowledge_version ?? 1,
      reviewed_at: now,
      reviewed_by: user.id,
      updated_at: now,
    }

    // Upsert wine knowledge (uses service role to bypass RLS)
    const { data: knowledge, error: upsertError } = await supabaseAdmin
      .from('wine_knowledge')
      .upsert(knowledgeData, {
        onConflict: 'wine_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[API] Error upserting wine knowledge:', upsertError)
      return NextResponse.json(
        { error: 'Errore nel salvataggio della conoscenza del vino' },
        { status: 500 }
      )
    }

    // Trigger embedding sync asynchronously (non-blocking)
    // This ensures the knowledge is reflected in semantic search
    syncEmbedding(wineId).catch((error) => {
      console.error('[API] Failed to sync embedding after knowledge update:', error)
      // Don't block the response - embedding sync is best-effort
    })

    return NextResponse.json({
      success: true,
      knowledge,
    })

  } catch (error) {
    console.error('[API] Error in PUT /api/admin/wines/[wineId]/knowledge:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio della conoscenza del vino' },
      { status: 500 }
    )
  }
}
