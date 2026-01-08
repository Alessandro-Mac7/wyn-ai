import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSuperAdmin } from '@/lib/supabase-auth-server'

// GET: Get app settings (public - needed for client-side checks)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Convert to key-value object
    const settingsObject: Record<string, unknown> = {}
    for (const setting of settings || []) {
      settingsObject[setting.key] = setting.value
    }

    return NextResponse.json({ settings: settingsObject })

  } catch (error) {
    console.error('Error in GET /api/internal/settings:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// PATCH: Update app settings (super_admin only)
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
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Chiave mancante' },
        { status: 400 }
      )
    }

    // Validate specific settings
    if (key === 'max_venue_distance_km') {
      const numValue = parseFloat(value)
      if (isNaN(numValue) || numValue < 0) {
        return NextResponse.json(
          { error: 'Valore non valido. Deve essere un numero >= 0' },
          { status: 400 }
        )
      }
    }

    // Update setting
    const { data, error } = await supabase
      .from('app_settings')
      .update({ value: value })
      .eq('key', key)
      .select('key, value')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ setting: data })

  } catch (error) {
    console.error('Error in PATCH /api/internal/settings:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
