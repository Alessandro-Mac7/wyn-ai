import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-auth-server'
import {
  extractPreferencesFromConversation,
  mergePreferences,
  calculateConfidence,
  buildConversationText,
} from '@/lib/preference-extractor'
import type { ChatSession, InferredPreferences } from '@/types/user'

// ============================================
// POST /api/chat-session/analyze
// Trigger preference analysis for user's sessions
// ============================================

const MIN_SESSIONS_FOR_ANALYSIS = 2
const MIN_CONFIDENCE_THRESHOLD = 0.4

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
      return NextResponse.json({
        analyzed: false,
        message: 'Consenso al profiling non attivo',
      })
    }

    // Fetch user's recent sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError)
      return NextResponse.json(
        { error: 'Errore nel recupero delle sessioni' },
        { status: 500 }
      )
    }

    // Need minimum sessions to analyze
    if (!sessions || sessions.length < MIN_SESSIONS_FOR_ANALYSIS) {
      return NextResponse.json({
        analyzed: false,
        message: `Servono almeno ${MIN_SESSIONS_FOR_ANALYSIS} sessioni per l'analisi`,
        sessionCount: sessions?.length || 0,
      })
    }

    // Build conversation text from sessions
    const conversationText = buildConversationText(sessions as ChatSession[])

    if (!conversationText.trim()) {
      return NextResponse.json({
        analyzed: false,
        message: 'Nessun dato sufficiente nelle sessioni',
      })
    }

    // Extract preferences from conversation
    const extractedPrefs = await extractPreferencesFromConversation(conversationText)

    if (!extractedPrefs) {
      return NextResponse.json({
        analyzed: false,
        message: 'Nessuna preferenza estratta',
      })
    }

    // Get existing preferences
    const { data: existingPrefs } = await supabaseAdmin
      .from('inferred_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Merge with existing preferences
    const mergedPrefs = existingPrefs
      ? mergePreferences(existingPrefs.preferences, extractedPrefs)
      : extractedPrefs

    // Calculate confidence
    const confidence = calculateConfidence(mergedPrefs, sessions.length)

    // Don't save if confidence is too low
    if (confidence < MIN_CONFIDENCE_THRESHOLD) {
      return NextResponse.json({
        analyzed: true,
        saved: false,
        message: 'Confidenza troppo bassa per salvare',
        confidence,
        preferences: mergedPrefs,
      })
    }

    // Build sources list
    const sources = sessions.slice(0, 5).map(s => s.id)

    // Upsert preferences
    const { data: savedPrefs, error: upsertError } = await supabaseAdmin
      .from('inferred_preferences')
      .upsert({
        user_id: user.id,
        preferences: mergedPrefs,
        confidence,
        sources,
        last_analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Preferences upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Errore nel salvataggio delle preferenze' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analyzed: true,
      saved: true,
      preferences: savedPrefs as InferredPreferences,
      confidence,
    })

  } catch (error) {
    console.error('Analyze POST error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/chat-session/analyze
// Get analysis status
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

    // Get session count
    const { count: sessionCount } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get existing preferences
    const { data: prefs } = await supabase
      .from('inferred_preferences')
      .select('confidence, last_analyzed_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      sessionCount: sessionCount || 0,
      minSessionsRequired: MIN_SESSIONS_FOR_ANALYSIS,
      canAnalyze: (sessionCount || 0) >= MIN_SESSIONS_FOR_ANALYSIS,
      lastAnalyzedAt: prefs?.last_analyzed_at || null,
      currentConfidence: prefs?.confidence || null,
    })

  } catch (error) {
    console.error('Analyze GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
