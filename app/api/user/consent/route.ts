import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { ConsentUpdate } from '@/types/user'

// ============================================
// GET /api/user/consent
// Get current consent status
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

    // Fetch consent from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('gdpr_consent_at, profiling_consent, marketing_consent')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          consent: {
            gdpr_consent_at: null,
            profiling_consent: false,
            marketing_consent: false,
          }
        })
      }
      console.error('Consent fetch error:', profileError)
      return NextResponse.json(
        { error: 'Errore nel recupero dei consensi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      consent: {
        gdpr_consent_at: profile.gdpr_consent_at,
        profiling_consent: profile.profiling_consent,
        marketing_consent: profile.marketing_consent,
      }
    })

  } catch (error) {
    console.error('Consent GET error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/user/consent
// Update consent settings
// ============================================

export async function PUT(request: NextRequest) {
  // Apply rate limiting for consent updates
  const rateLimitResponse = withRateLimit(request, RATE_LIMITS.consent, 'consent')
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

    const body: ConsentUpdate = await request.json()
    const { gdpr_consent, profiling_consent, marketing_consent } = body

    // Build update object
    const updateData: Record<string, unknown> = {}

    // GDPR consent is special - once given, we record the timestamp
    if (gdpr_consent === true) {
      updateData.gdpr_consent_at = new Date().toISOString()
    } else if (gdpr_consent === false) {
      // Revoking GDPR consent - this should trigger data deletion workflow
      updateData.gdpr_consent_at = null
    }

    // Optional consents
    if (profiling_consent !== undefined) {
      updateData.profiling_consent = profiling_consent
    }
    if (marketing_consent !== undefined) {
      updateData.marketing_consent = marketing_consent
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun consenso da aggiornare' },
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
      console.error('Consent update error:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dei consensi' },
        { status: 500 }
      )
    }

    // If GDPR consent was revoked, trigger deletion of optional data
    if (gdpr_consent === false) {
      // Delete inferred preferences (non-essential data)
      await supabase
        .from('inferred_preferences')
        .delete()
        .eq('user_id', user.id)

      // Note: chat_sessions and wine_scans are kept for service operation
      // but can be deleted via /api/user/delete endpoint
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Consent PUT error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
