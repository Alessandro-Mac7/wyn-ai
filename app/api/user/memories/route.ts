import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// ============================================
// GET /api/user/memories
// List all user's memories (for "I miei ricordi" section)
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

    // Fetch memories (RLS ensures user can only see own)
    // Select all fields except embedding (too large for API response)
    const { data: memories, error } = await supabase
      .from('memory_fragments')
      .select('id, user_id, fragment_type, content, metadata, weight, last_relevant_at, source_session_id, source_venue_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('last_relevant_at', { ascending: false })

    if (error) {
      console.error('Memories fetch error:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero dei ricordi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ memories: memories || [] })
  } catch (error) {
    console.error('Memories GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/user/memories
// Delete specific or all memories
// ============================================

export async function DELETE(request: NextRequest) {
  // Apply rate limiting for memory deletion
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.general, 'memories')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

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
    const { memory_id, delete_all } = body as { memory_id?: string; delete_all?: boolean }

    if (!memory_id && !delete_all) {
      return NextResponse.json(
        { error: 'Specificare memory_id o delete_all' },
        { status: 400 }
      )
    }

    let deletedCount = 0

    if (delete_all) {
      // Delete all user's memories (RLS ensures ownership)
      const { data, error } = await supabase
        .from('memory_fragments')
        .delete()
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        console.error('Delete all memories error:', error)
        return NextResponse.json(
          { error: 'Errore nella cancellazione dei ricordi' },
          { status: 500 }
        )
      }
      deletedCount = data?.length || 0
    } else if (memory_id) {
      // Delete single memory (RLS ensures ownership)
      const { data, error } = await supabase
        .from('memory_fragments')
        .delete()
        .eq('id', memory_id)
        .eq('user_id', user.id)  // Extra safety
        .select('id')

      if (error) {
        console.error('Delete memory error:', error)
        return NextResponse.json(
          { error: 'Errore nella cancellazione del ricordo' },
          { status: 500 }
        )
      }
      deletedCount = data?.length || 0
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
    })
  } catch (error) {
    console.error('Memories DELETE error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
