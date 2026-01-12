import { NextRequest, NextResponse } from 'next/server'
import { scanWineLabel, validateImageData } from '@/lib/vision'
import { findMatchingWine, findSimilarWines } from '@/lib/wine-matcher'
import { getVenueBySlug, getWinesWithRatings } from '@/lib/supabase'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { ScanLabelResponse } from '@/types'

interface ScanLabelRequest {
  image: string // Base64 data URL
  venue_slug?: string
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`scan:${clientId}`, RATE_LIMITS.scan)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetIn),
        },
      }
    )
  }

  try {
    const body: ScanLabelRequest = await request.json()

    // Validate required fields
    if (!body.image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Validate image data
    const imageValidation = validateImageData(body.image)
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error || 'Invalid image data' },
        { status: 400 }
      )
    }

    // Scan the wine label using vision API
    const scanResult = await scanWineLabel(body.image)

    // Check confidence threshold (as per PLAN-STRATEGIC-FEATURES.md)
    if (scanResult.confidence < 0.3) {
      const response: ScanLabelResponse = {
        success: false,
        message: 'Non riesco a leggere bene l\'etichetta. Prova con più luce e inquadra meglio.',
        scanned: scanResult,
        match: null,
        alternatives: [],
      }
      return NextResponse.json(response)
    }

    // If no venue_slug provided, return scan result only
    if (!body.venue_slug) {
      const response: ScanLabelResponse = {
        success: true,
        scanned: scanResult,
        match: null,
        alternatives: [],
      }
      return NextResponse.json(response)
    }

    // Get venue and its wines
    const venue = await getVenueBySlug(body.venue_slug)
    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      )
    }

    // Get only available wines with ratings for matching (RULE-001)
    const wines = await getWinesWithRatings(venue.id, true)

    if (wines.length === 0) {
      const response: ScanLabelResponse = {
        success: true,
        message: 'Nessun vino disponibile per questo locale',
        scanned: scanResult,
        match: null,
        alternatives: [],
      }
      return NextResponse.json(response)
    }

    // Find best match
    const match = findMatchingWine(scanResult, wines)

    // Find similar alternatives (if match confidence is low or no exact match)
    let alternatives = findSimilarWines(scanResult, wines, 3)
      // Exclude the matched wine if present
      .filter(alt => !match || alt.wine.id !== match.wine.id)

    // Only include alternatives if no good match
    if (match && match.confidence >= 0.7) {
      alternatives = []
    }

    const response: ScanLabelResponse = {
      success: true,
      scanned: scanResult,
      match: match || null,
      alternatives,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Scan Label API Error:', error)

    // Check if it's a vision API error
    if (error instanceof Error && error.message.includes('vision')) {
      return NextResponse.json(
        { error: 'Errore nella scansione dell\'etichetta. Riprova.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
