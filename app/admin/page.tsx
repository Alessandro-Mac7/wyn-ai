'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { LoginForm } from '@/components/admin'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AdminLoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if already logged in on mount
  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!mounted) return

        if (user) {
          // Check roles to redirect to appropriate page
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)

          if (!mounted) return

          const isSuperAdmin = rolesData?.some(r => r.role === 'super_admin')
          const isVenueAdmin = rolesData?.some(r => r.role === 'venue_admin')

          if (isSuperAdmin) {
            router.push('/internal/venues')
            return
          } else if (isVenueAdmin) {
            router.push('/admin/dashboard')
            return
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        if (mounted) setIsLoading(false)
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return false
      }

      // After successful login, check roles and redirect
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        const isSuperAdmin = rolesData?.some(r => r.role === 'super_admin')
        const isVenueAdmin = rolesData?.some(r => r.role === 'venue_admin')

        if (isSuperAdmin) {
          router.push('/internal/venues')
        } else if (isVenueAdmin) {
          router.push('/admin/dashboard')
        } else {
          setError('Accesso non autorizzato')
          await supabase.auth.signOut()
          return false
        }
      }

      return true
    } catch (err) {
      console.error('Login error:', err)
      setError('Errore durante il login')
      return false
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm onSubmit={handleLogin} error={error} />
    </main>
  )
}
