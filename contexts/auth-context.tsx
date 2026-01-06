'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'

// ============================================
// TYPES
// ============================================

interface UserRole {
  isSuperAdmin: boolean
  isVenueAdmin: boolean
}

interface VenueInfo {
  id: string
  slug: string
  name: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  roles: UserRole
  venue: VenueInfo | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | null>(null)

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roles, setRoles] = useState<UserRole>({ isSuperAdmin: false, isVenueAdmin: false })
  const [venue, setVenue] = useState<VenueInfo | null>(null)

  // Bug #4: Fetch user roles and venue info with explicit error handling
  const fetchUserData = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        // Reset to safe defaults on error
        setRoles({ isSuperAdmin: false, isVenueAdmin: false })
        setVenue(null)
        return false
      }

      const userRoles: UserRole = {
        isSuperAdmin: rolesData?.some(r => r.role === 'super_admin') || false,
        isVenueAdmin: rolesData?.some(r => r.role === 'venue_admin') || false,
      }
      setRoles(userRoles)

      // Fetch venue if venue_admin
      if (userRoles.isVenueAdmin) {
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id, slug, name')
          .eq('owner_id', userId)
          .single()

        if (venueError) {
          console.error('Error fetching venue:', venueError)
          // Continue without venue - user can still use the app
        } else if (venueData) {
          setVenue(venueData)
        }
      } else {
        // Clear venue for non-venue admins
        setVenue(null)
      }

      return true
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Reset to safe defaults on error
      setRoles({ isSuperAdmin: false, isVenueAdmin: false })
      setVenue(null)
      return false
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    let isMounted = true
    let initialSessionHandled = false

    // Handle session changes (both initial and subsequent)
    const handleSession = async (session: Session | null, isInitial: boolean) => {
      if (!isMounted) return

      try {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setRoles({ isSuperAdmin: false, isVenueAdmin: false })
          setVenue(null)
        }
      } catch (error) {
        console.error('Error handling session:', error)
        // Reset to safe state on error
        setRoles({ isSuperAdmin: false, isVenueAdmin: false })
        setVenue(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Listen for auth changes - this is the SINGLE source of truth
    // IMPORTANT: onAuthStateChange fires INITIAL_SESSION immediately upon subscription,
    // which properly handles session restoration from cookies on page refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        // INITIAL_SESSION fires immediately and handles session restoration on refresh
        if (event === 'INITIAL_SESSION') {
          initialSessionHandled = true
          await handleSession(newSession, true)
          return
        }

        // For subsequent events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
        // Set loading true during auth state transitions
        setIsLoading(true)
        await handleSession(newSession, false)
      }
    )

    // Fallback: If INITIAL_SESSION doesn't fire within a reasonable time,
    // manually check the session. This handles edge cases where the event might not fire.
    const fallbackTimeout = setTimeout(async () => {
      if (!initialSessionHandled && isMounted) {
        console.warn('INITIAL_SESSION event did not fire, falling back to getUser()')
        try {
          // Use getUser() instead of getSession() - getUser() validates with server
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          if (!isMounted) return

          if (currentUser) {
            // Get the session after confirming user exists
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            await handleSession(currentSession, true)
          } else {
            await handleSession(null, true)
          }
        } catch (error) {
          console.error('Fallback auth check failed:', error)
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }
    }, 1000) // 1 second fallback timeout

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setIsLoading(false)
        return { error: error.message }
      }

      // Loading will be reset by onAuthStateChange SIGNED_IN event
      return {}
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
      return { error: 'Errore durante il login' }
    }
  }

  // Sign out
  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setRoles({ isSuperAdmin: false, isVenueAdmin: false })
      setVenue(null)
      // Loading will be reset by onAuthStateChange SIGNED_OUT event
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  // Bug #6: Refresh session with error handling and loading state
  const refreshSession = async () => {
    setIsLoading(true)
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Error refreshing session:', error)
        // Clear auth state on refresh error
        setSession(null)
        setUser(null)
        setRoles({ isSuperAdmin: false, isVenueAdmin: false })
        setVenue(null)
        return
      }

      setSession(refreshedSession)
      setUser(refreshedSession?.user ?? null)

      // Re-fetch user data if session exists
      if (refreshedSession?.user) {
        await fetchUserData(refreshedSession.user.id)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      // Clear auth state on unexpected error
      setSession(null)
      setUser(null)
      setRoles({ isSuperAdmin: false, isVenueAdmin: false })
      setVenue(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        roles,
        venue,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// Convenience hooks
export function useIsSuperAdmin() {
  const { roles } = useAuth()
  return roles.isSuperAdmin
}

export function useIsVenueAdmin() {
  const { roles } = useAuth()
  return roles.isVenueAdmin
}

export function useVenue() {
  const { venue } = useAuth()
  return venue
}
