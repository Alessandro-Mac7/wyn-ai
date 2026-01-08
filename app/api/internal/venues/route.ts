import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSuperAdmin, createVenueWithAdmin } from '@/lib/supabase-auth-server'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting for auth/admin operations
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`venues:${clientId}`, RATE_LIMITS.auth)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      { status: 429 }
    )
  }

  try {
    // Get server client with session
    const supabase = await createSupabaseServerClient()

    // Verify session exists
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Verify super_admin role
    const isAdmin = await isSuperAdmin(user.id)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo super admin.' },
        { status: 403 }
      )
    }

    // Parse request body
    const { name, slug, email, password, description, latitude, longitude, address, city } = await request.json()

    // Validate required fields
    if (!name || !slug || !email || !password) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: name, slug, email, password' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    const parsedLat = latitude ? parseFloat(latitude) : null
    const parsedLng = longitude ? parseFloat(longitude) : null

    if (parsedLat !== null && (parsedLat < -90 || parsedLat > 90)) {
      return NextResponse.json(
        { error: 'Latitudine non valida (deve essere tra -90 e 90)' },
        { status: 400 }
      )
    }

    if (parsedLng !== null && (parsedLng < -180 || parsedLng > 180)) {
      return NextResponse.json(
        { error: 'Longitudine non valida (deve essere tra -180 e 180)' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug non valido. Usare solo lettere minuscole, numeri e trattini.' },
        { status: 400 }
      )
    }

    // Validate password complexity
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }

    // Check password has at least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno una lettera maiuscola, una minuscola e un numero' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400 }
      )
    }

    // Create venue with admin
    const result = await createVenueWithAdmin({
      name,
      slug,
      email,
      password,
      description,
      latitude: parsedLat,
      longitude: parsedLng,
      address: address || null,
      city: city || null,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      venue: result.venue,
    })

  } catch (error) {
    console.error('Error in POST /api/internal/venues:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// GET: List all venues (for super_admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verify session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Verify super_admin role
    const isAdmin = await isSuperAdmin(user.id)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      )
    }

    // Fetch all venues with location data
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, slug, name, email, description, latitude, longitude, address, city, created_at, owner_id')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ venues })

  } catch (error) {
    console.error('Error in GET /api/internal/venues:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// PATCH: Update a venue (for super_admin)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verify session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Verify super_admin role
    const isAdmin = await isSuperAdmin(user.id)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      )
    }

    // Parse request body
    const { id, name, description, latitude, longitude, address, city } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID del locale mancante' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    const parsedLat = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null
    const parsedLng = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null

    if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      return NextResponse.json(
        { error: 'Latitudine non valida (deve essere tra -90 e 90)' },
        { status: 400 }
      )
    }

    if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      return NextResponse.json(
        { error: 'Longitudine non valida (deve essere tra -180 e 180)' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (address !== undefined) updateData.address = address || null
    if (city !== undefined) updateData.city = city || null
    if (latitude !== undefined) updateData.latitude = parsedLat
    if (longitude !== undefined) updateData.longitude = parsedLng

    // Update venue
    const { data: venue, error } = await supabase
      .from('venues')
      .update(updateData)
      .eq('id', id)
      .select('id, slug, name, email, description, latitude, longitude, address, city, created_at')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ venue })

  } catch (error) {
    console.error('Error in PATCH /api/internal/venues:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
