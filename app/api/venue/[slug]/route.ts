import { NextRequest, NextResponse } from 'next/server'
import { getVenueBySlug, getWinesByVenue } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const venue = await getVenueBySlug(slug)

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      )
    }

    // Fetch available wines for stats
    const wines = await getWinesByVenue(venue.id, true)

    return NextResponse.json({
      venue,
      wines,
    })
  } catch (error) {
    console.error('Error fetching venue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
