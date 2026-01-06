import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get current session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ============================================
  // ROUTE PROTECTION: /internal/*
  // Only super_admin can access
  // ============================================
  if (pathname.startsWith('/internal')) {
    if (!user) {
      // Not logged in, redirect to admin login
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Check if user is super_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (!roleData) {
      // Not super_admin, redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ============================================
  // ROUTE PROTECTION: /admin/dashboard
  // Only venue_admin can access (super_admin uses /internal)
  // ============================================
  if (pathname.startsWith('/admin/dashboard')) {
    if (!user) {
      // Not logged in, redirect to admin login
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Check user roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isSuperAdmin = roleData?.some(r => r.role === 'super_admin')
    const isVenueAdmin = roleData?.some(r => r.role === 'venue_admin')

    // Super admin should use /internal, not /admin/dashboard
    if (isSuperAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/internal/venues'
      return NextResponse.redirect(url)
    }

    if (!isVenueAdmin) {
      // No venue_admin role, redirect to home
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // ============================================
  // ROUTE: /admin (login page)
  // Redirect to dashboard if already logged in
  // ============================================
  if (pathname === '/admin') {
    if (user) {
      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const isSuperAdmin = roleData?.some(r => r.role === 'super_admin')
      const isVenueAdmin = roleData?.some(r => r.role === 'venue_admin')

      if (isSuperAdmin) {
        // Super admin goes to internal venues
        const url = request.nextUrl.clone()
        url.pathname = '/internal/venues'
        return NextResponse.redirect(url)
      } else if (isVenueAdmin) {
        // Venue admin goes to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/internal/:path*',
    '/admin/:path*',
  ],
}
