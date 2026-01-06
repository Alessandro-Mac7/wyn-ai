import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enrichWine, refreshWine } from '@/lib/enrichment'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { Wine } from '@/types'

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
    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Fetch wine
    const { data: wine, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wine_id)
      .single()

    if (error || !wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      )
    }

    // Run enrichment (this may take time)
    const enrichedWine = await enrichWine(wine as Wine)

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
  const { searchParams } = new URL(request.url)
  const wineId = searchParams.get('wine_id')

  if (!wineId) {
    return NextResponse.json(
      { error: 'Wine ID required' },
      { status: 400 }
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
}

// PUT endpoint to refresh enrichment (delete old ratings + re-enrich)
export async function PUT(request: NextRequest) {
  try {
    const { wine_id } = await request.json()

    if (!wine_id) {
      return NextResponse.json(
        { error: 'Wine ID required' },
        { status: 400 }
      )
    }

    // Fetch wine
    const { data: wine, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wine_id)
      .single()

    if (error || !wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      )
    }

    // Run refresh (delete old ratings + re-enrich)
    const refreshedWine = await refreshWine(wine as Wine)

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
