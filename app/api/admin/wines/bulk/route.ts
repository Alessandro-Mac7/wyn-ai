import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { triggerEnrichmentAsync } from '@/lib/enrichment'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { BULK_IMPORT_MAX_SIZE, RATE_LIMITS } from '@/config/constants'
import type { BulkImportRequest, BulkImportResponse, Wine } from '@/types'

export async function POST(request: NextRequest) {
  // Rate limiting (stricter for bulk operations)
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`bulk:${clientId}`, RATE_LIMITS.bulk)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Attendi prima di importare altri vini.' },
      { status: 429 }
    )
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Get user's venue
    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!venue) {
      return NextResponse.json({ error: 'Nessun locale associato' }, { status: 404 })
    }

    const body: BulkImportRequest = await request.json()

    // Validate request
    if (!body.wines || !Array.isArray(body.wines)) {
      return NextResponse.json({ error: 'Formato richiesta non valido' }, { status: 400 })
    }

    if (body.wines.length === 0) {
      return NextResponse.json({ error: 'Nessun vino da importare' }, { status: 400 })
    }

    // Validate batch size
    if (body.wines.length > BULK_IMPORT_MAX_SIZE) {
      return NextResponse.json(
        { error: `Massimo ${BULK_IMPORT_MAX_SIZE} vini per importazione` },
        { status: 400 }
      )
    }

    // Prepare wines for insertion
    const winesToInsert = body.wines.map((wine) => ({
      venue_id: venue.id,
      name: wine.name,
      wine_type: wine.wine_type,
      price: wine.price,
      price_glass: wine.price_glass || null,
      producer: wine.producer || null,
      region: wine.region || null,
      denomination: wine.denomination || null,
      grape_varieties: wine.grape_varieties || null,
      year: wine.year || null,
      description: wine.description || null,
      available: true,
      recommended: false,
    }))

    // Bulk insert with Supabase
    const { data: insertedWines, error: insertError } = await supabase
      .from('wines')
      .insert(winesToInsert)
      .select()

    if (insertError) {
      console.error('Bulk insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Errore durante l\'importazione',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    const importedWines: Wine[] = insertedWines || []

    // Trigger enrichment for all imported wines (fire-and-forget)
    importedWines.forEach((wine) => {
      triggerEnrichmentAsync(wine)
    })

    const response: BulkImportResponse = {
      imported: importedWines.length,
      failed: body.wines.length - importedWines.length,
      wines: importedWines,
      errors: [], // Supabase bulk insert is all-or-nothing
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
