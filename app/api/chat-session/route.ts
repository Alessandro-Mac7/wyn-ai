import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-auth-server'
import type { ChatSession, ChatSessionCreate } from '@/types/user'

// ============================================
// GET /api/chat-session
// Fetch user's chat sessions (max 10)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 10)

    // Fetch sessions with venue info
    const { data: sessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        venue:venues(id, name, slug)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      console.error('Sessions fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Errore nel recupero delle sessioni' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessions: sessions || [],
    })

  } catch (error) {
    console.error('Chat session GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/chat-session
// Create or update a chat session
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

    // Check if user has profiling consent
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('profiling_consent')
      .eq('user_id', user.id)
      .single()

    if (!profile?.profiling_consent) {
      // User hasn't consented to profiling, don't store session data
      return NextResponse.json({
        session: null,
        message: 'Consenso al profiling non attivo',
      })
    }

    const body = await request.json()
    const {
      id: sessionId,
      venue_id,
      summary,
      message_count,
      wines_mentioned,
      ended_at,
    } = body as ChatSessionCreate & { id?: string; ended_at?: string }

    // Update existing session
    if (sessionId) {
      const updateData: Record<string, unknown> = {}
      if (summary !== undefined) updateData.summary = summary
      if (message_count !== undefined) updateData.message_count = message_count
      if (wines_mentioned !== undefined) updateData.wines_mentioned = wines_mentioned
      if (ended_at !== undefined) updateData.ended_at = ended_at

      const { data: session, error: updateError } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id) // Ensure user owns this session
        .select()
        .single()

      if (updateError) {
        console.error('Session update error:', updateError)
        return NextResponse.json(
          { error: 'Errore nell\'aggiornamento della sessione' },
          { status: 500 }
        )
      }

      return NextResponse.json({ session })
    }

    // Create new session
    const { data: session, error: createError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        venue_id: venue_id || null,
        summary: summary || {},
        message_count: message_count || 0,
        wines_mentioned: wines_mentioned || [],
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Session create error:', createError)
      return NextResponse.json(
        { error: 'Errore nella creazione della sessione' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session }, { status: 201 })

  } catch (error) {
    console.error('Chat session POST error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/chat-session
// Delete a specific chat session
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID sessione mancante' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user owns this session

    if (deleteError) {
      console.error('Session delete error:', deleteError)
      return NextResponse.json(
        { error: 'Errore nella cancellazione della sessione' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Chat session DELETE error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
