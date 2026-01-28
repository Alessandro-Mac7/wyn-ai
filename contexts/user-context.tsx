'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type {
  UserProfile,
  InferredPreferences,
  ConsentUpdate,
  AuthState,
} from '@/types/user'
import {
  createSupabaseBrowserClient,
  onAuthStateChange,
} from '@/lib/supabase-auth'

// ============================================
// CONTEXT TYPES
// ============================================

interface UserContextType extends AuthState {
  // Profile actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
  // Consent actions
  updateConsent: (consent: ConsentUpdate) => Promise<void>
  // Auth actions
  signOut: () => Promise<void>
}

// ============================================
// ACTIONS
// ============================================

type UserAction =
  | { type: 'SET_USER'; payload: { id: string; email?: string } | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_PREFERENCES'; payload: InferredPreferences | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'RESET' }

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
  user: null,
  profile: null,
  preferences: null,
  isLoading: true,
  isAuthenticated: false,
}

// ============================================
// REDUCER
// ============================================

function userReducer(state: AuthState, action: UserAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: !!action.payload, // Keep loading if we have a user (need to fetch profile)
      }

    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload,
        isLoading: false,
      }

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    case 'UPDATE_PROFILE':
      if (!state.profile) return state
      return {
        ...state,
        profile: { ...state.profile, ...action.payload },
      }

    case 'RESET':
      return {
        ...initialState,
        isLoading: false,
      }

    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================

const UserContext = createContext<UserContextType | null>(null)

// ============================================
// PROVIDER
// ============================================

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initialState)
  const mountedRef = useRef(true)

  // Fetch user profile from API
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (!mountedRef.current) return

      if (!response.ok) {
        if (response.status === 401) {
          dispatch({ type: 'SET_PROFILE', payload: null })
          return
        }
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      if (!mountedRef.current) return

      dispatch({ type: 'SET_PROFILE', payload: data.profile })
      if (data.preferences) {
        dispatch({ type: 'SET_PREFERENCES', payload: data.preferences })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (mountedRef.current) {
        dispatch({ type: 'SET_PROFILE', payload: null })
      }
    }
  }, [])

  // Check if user has admin role (should not be treated as regular user)
  const checkIsAdminUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      return rolesData?.some(
        r => r.role === 'super_admin' || r.role === 'venue_admin'
      ) ?? false
    } catch (error) {
      console.error('Error checking admin role:', error)
      return false
    }
  }, [])

  // Initialize auth state and listen for changes
  useEffect(() => {
    mountedRef.current = true

    // Get initial session
    const initAuth = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!mountedRef.current) return

      if (user) {
        // Check if user has admin role - admins are excluded from regular user context
        const isAdmin = await checkIsAdminUser(user.id)
        if (isAdmin) {
          // Admin users don't get treated as regular users in this context
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        dispatch({ type: 'SET_USER', payload: { id: user.id, email: user.email } })
        await fetchProfile()
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()

    // Subscribe to auth changes
    const subscription = onAuthStateChange(async (user) => {
      if (!mountedRef.current) return

      if (user) {
        // Check if user has admin role - admins are excluded from regular user context
        const isAdmin = await checkIsAdminUser(user.id)
        if (isAdmin) {
          // Admin users don't get treated as regular users
          dispatch({ type: 'RESET' })
          return
        }

        dispatch({ type: 'SET_USER', payload: { id: user.id, email: user.email } })
        fetchProfile()
      } else {
        dispatch({ type: 'RESET' })
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, checkIsAdminUser])

  // Update profile
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const { profile } = await response.json()
      dispatch({ type: 'SET_PROFILE', payload: profile })
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }, [])

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  // Update consent
  const updateConsent = useCallback(async (consent: ConsentUpdate) => {
    try {
      const response = await fetch('/api/user/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consent),
      })

      if (!response.ok) {
        throw new Error('Failed to update consent')
      }

      const { profile } = await response.json()
      dispatch({ type: 'SET_PROFILE', payload: profile })
    } catch (error) {
      console.error('Error updating consent:', error)
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    dispatch({ type: 'RESET' })
  }, [])

  // Build context value
  const contextValue: UserContextType = {
    ...state,
    updateProfile,
    refreshProfile,
    updateConsent,
    signOut,
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Optional hook that doesn't throw (for components that might be outside provider)
export function useUserOptional(): UserContextType | null {
  return useContext(UserContext)
}
