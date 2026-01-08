import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { VenueWithDistance } from '@/types'

// Haversine formula to calculate distance between two points on Earth
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Default radius in kilometers
const DEFAULT_RADIUS = 10
const DEFAULT_LIMIT = 10
const MAX_DISTANCE_KM = 50 // Policy: max distance user can be from venue

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate coordinates
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const radiusParam = searchParams.get('radius')
    const limitParam = searchParams.get('limit')

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      )
    }

    const userLat = parseFloat(latParam)
    const userLng = parseFloat(lngParam)

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range' },
        { status: 400 }
      )
    }

    const radius = radiusParam ? parseFloat(radiusParam) : DEFAULT_RADIUS
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT

    // Create Supabase client (anonymous access for public venues)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch all venues with coordinates
    // Note: For larger datasets, we'd use PostGIS for server-side filtering
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, slug, name, description, email, latitude, longitude, address, city, created_at, updated_at')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching venues:', error)
      return NextResponse.json(
        { error: 'Failed to fetch venues' },
        { status: 500 }
      )
    }

    // Calculate distances and filter by radius
    const venuesWithDistance: VenueWithDistance[] = (venues || [])
      .map((venue) => ({
        ...venue,
        distance: haversineDistance(
          userLat,
          userLng,
          venue.latitude as number,
          venue.longitude as number
        ),
      }))
      .filter((venue) => venue.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      venues: venuesWithDistance,
      userLocation: {
        latitude: userLat,
        longitude: userLng,
      },
      maxAllowedDistance: MAX_DISTANCE_KM,
    })
  } catch (error) {
    console.error('Error in GET /api/venues/nearby:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
