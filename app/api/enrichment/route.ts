import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { enrichWine, refreshWine } from '@/lib/enrichment'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { Wine } from '@/types'

/**
 * Verify user has permission to access/modify a wine
 * User must be owner of the venue OR super_admin
 */
async function verifyWineAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  wineId: string
): Promise<{ authorized: boolean; wine: Wine | null; error?: string }> {
  // Fetch wine with venue info
  const { data: wine, error } = await supabase
    .from('wines')
    .select('*, venues!inner(owner_id)')
    .eq('id', wineId)
    .single()

  if (error || !wine) {
    return { authorized: false, wine: null, error: 'Wine not found' }
  }

  // Check if user is venue owner
  const isOwner = wine.venues?.owner_id === userId

  // Check if user is super_admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single()

  const isSuperAdmin = !!roleData

  if (!isOwner && !isSuperAdmin) {
    return { authorized: false, wine: null, error: 'Non autorizzato' }
  }

  // Remove venues join data before returning
  const { venues: _, ...wineData } = wine
  return { authorized: true, wine: wineData as Wine }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`enrichment:${clientId}`, RATE_LIMITS.enrichment)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      { status: 429 }
    )
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Verify user has access to this wine
    const { authorized, wine, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wine_id
    )

    if (!authorized || !wine) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Wine not found' ? 404 : 403 }
      )
    }

    // Run enrichment (this may take time)
    const enrichedWine = await enrichWine(wine)

    return NextResponse.json({
      success: true,
      wine_id,
      ratings_count: enrichedWine.ratings.length,
    })
  } catch (error) {
    console.error('Enrichment API error:', error)
    return NextResponse.json(
      { error: 'Enrichment failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check enrichment status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const wineId = searchParams.get('wine_id')

    if (!wineId) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Verify user has access to this wine
    const { authorized, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wineId
    )

    if (!authorized) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Wine not found' ? 404 : 403 }
      )
    }

    const { data: job } = await supabase
      .from('enrichment_jobs')
      .select('*')
      .eq('wine_id', wineId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Enrichment status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

// PUT endpoint to refresh enrichment (delete old ratings + re-enrich)
export async function PUT(request: NextRequest) {
  // Rate limiting for refresh
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`enrichment:${clientId}`, RATE_LIMITS.enrichment)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      { status: 429 }
    )
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Verify user has access to this wine
    const { authorized, wine, error: accessError } = await verifyWineAccess(
      supabase,
      user.id,
      wine_id
    )

    if (!authorized || !wine) {
      return NextResponse.json(
        { error: accessError || 'Non autorizzato' },
        { status: accessError === 'Wine not found' ? 404 : 403 }
      )
    }

    // Run refresh (delete old ratings + re-enrich)
    const refreshedWine = await refreshWine(wine)

    return NextResponse.json({
      success: true,
      wine_id,
      ratings_count: refreshedWine.ratings.length,
    })
  } catch (error) {
    console.error('Refresh enrichment API error:', error)
    return NextResponse.json(
      { error: 'Refresh failed' },
      { status: 500 }
    )
  }
}
