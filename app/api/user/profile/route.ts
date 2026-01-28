import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-auth-server'
import type { UserProfile, InferredPreferences } from '@/types/user'

// ============================================
// GET /api/user/profile
// Fetch current user's profile and preferences
// ============================================

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Errore nel recupero del profilo' },
        { status: 500 }
      )
    }

    // Fetch preferences
    const { data: preferences, error: prefError } = await supabase
      .from('inferred_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Preferences fetch error:', prefError)
      // Non-blocking, continue without preferences
    }

    return NextResponse.json({
      profile: profile as UserProfile | null,
      preferences: preferences as InferredPreferences | null,
    })

  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/user/profile
// Create profile (usually auto-created by trigger)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name } = body

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Profilo gia esistente' },
        { status: 409 }
      )
    }

    // Create profile
    const { data: profile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        display_name: display_name || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Profile create error:', createError)
      return NextResponse.json(
        { error: 'Errore nella creazione del profilo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 201 })

  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH /api/user/profile
// Update profile fields
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { display_name, avatar_url } = body

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {}
    if (display_name !== undefined) updateData.display_name = display_name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare' },
        { status: 400 }
      )
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento del profilo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
