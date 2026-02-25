import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-auth-server'

// Memory decay constants
const DECAY_FACTOR = 0.05    // Reduce weight by 5%
const STALE_DAYS = 30        // Memories not accessed in 30 days
const MIN_WEIGHT = 0.1       // Never fully forgotten

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel cron sends this header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Call the decay function
    const { data, error } = await supabaseAdmin.rpc('decay_memory_weights', {
      decay_factor: DECAY_FACTOR,
      stale_days: STALE_DAYS,
      min_weight: MIN_WEIGHT,
    })

    if (error) {
      console.error('[MEMORY-DECAY] Error:', error)
      return NextResponse.json(
        { error: 'Errore nel decay delle memorie' },
        { status: 500 }
      )
    }

    const updatedCount = data as number

    console.log(`[MEMORY-DECAY] Decayed ${updatedCount} stale memory fragments`)

    return NextResponse.json({
      success: true,
      decayed: updatedCount,
      params: {
        decay_factor: DECAY_FACTOR,
        stale_days: STALE_DAYS,
        min_weight: MIN_WEIGHT,
      },
    })
  } catch (error) {
    console.error('[MEMORY-DECAY] Cron error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
