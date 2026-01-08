import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-auth-server'

// GET: Get public app settings (no auth required)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error) {
      // Return defaults if table doesn't exist yet
      return NextResponse.json({
        settings: {
          max_venue_distance_km: 50
        }
      })
    }

    // Convert to key-value object
    const settingsObject: Record<string, unknown> = {}
    for (const setting of settings || []) {
      settingsObject[setting.key] = setting.value
    }

    // Ensure defaults
    if (!settingsObject.max_venue_distance_km) {
      settingsObject.max_venue_distance_km = 50
    }

    return NextResponse.json({ settings: settingsObject })

  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    // Return defaults on error
    return NextResponse.json({
      settings: {
        max_venue_distance_km: 50
      }
    })
  }
}
