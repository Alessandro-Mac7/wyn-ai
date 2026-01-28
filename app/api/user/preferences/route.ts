import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import type { InferredPreferences } from '@/types/user'

// ============================================
// GET /api/user/preferences
// Fetch current user's inferred preferences
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

    // Fetch preferences
    const { data: preferences, error: prefError } = await supabase
      .from('inferred_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (prefError) {
      if (prefError.code === 'PGRST116') {
        // No preferences found - return empty
        return NextResponse.json({ preferences: null })
      }
      console.error('Preferences fetch error:', prefError)
      return NextResponse.json(
        { error: 'Errore nel recupero delle preferenze' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      preferences: preferences as InferredPreferences,
    })

  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/user/preferences
// Reset user's inferred preferences
// ============================================

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Delete preferences
    const { error: deleteError } = await supabase
      .from('inferred_preferences')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Preferences delete error:', deleteError)
      return NextResponse.json(
        { error: 'Errore nella cancellazione delle preferenze' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Preferences DELETE error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
