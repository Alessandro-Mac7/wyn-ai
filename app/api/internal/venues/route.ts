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
    const { name, slug, email, password, description } = await request.json()

    // Validate required fields
    if (!name || !slug || !email || !password) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: name, slug, email, password' },
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

    // Fetch all venues
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, slug, name, email, description, created_at, owner_id')
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
