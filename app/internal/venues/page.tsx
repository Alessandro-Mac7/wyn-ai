'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2, Mail, Lock, FileText, Check, AlertCircle, LogOut } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormData {
  name: string
  slug: string
  email: string
  password: string
  description: string
}

interface Result {
  success?: boolean
  message?: string
  venue?: { id: string; slug: string; name: string }
}

export default function VenueRegistrationPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    email: '',
    password: '',
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<Result>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get user email on mount (non-blocking)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin')
    router.refresh()
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.name)
        ? generateSlug(name)
        : prev.slug
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult({})

    try {
      const res = await fetch('/api/internal/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: 'Locale censito con successo!',
          venue: data.venue,
        })
        // Reset form
        setFormData({
          name: '',
          slug: '',
          email: '',
          password: '',
          description: '',
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Errore durante la creazione',
        })
      }
    } catch (error) {
      console.error('Error creating venue:', error)
      setResult({
        success: false,
        message: 'Errore di connessione',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Note: Access control is handled by middleware - no need to check here

  const inputClass = cn(
    'w-full h-11 pl-10 pr-4 bg-secondary rounded-lg border-0 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-wine',
    'placeholder:text-muted-foreground'
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wyn-icon.ico"
              alt="WYN"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="mina-regular text-lg">INTERNAL</span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-wine/20">
                <Building2 className="h-6 w-6 text-wine" />
              </div>
              <div>
                <h1 className="mina-regular text-2xl">CENSIMENTO LOCALE</h1>
                <p className="text-sm text-muted-foreground">
                  Registra un nuovo ristorante sulla piattaforma
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome Locale */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Locale *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="es. Osteria del Vino Buono"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug URL *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    /v/
                  </span>
                  <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="osteria-vino-buono"
                    className={cn(inputClass, 'pl-10')}
                    required
                    pattern="[a-z0-9-]+"
                    title="Solo lettere minuscole, numeri e trattini"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL finale: {process.env.NEXT_PUBLIC_APP_URL || 'https://wyn.app'}/v/{formData.slug || 'slug'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border pt-6">
                <p className="text-sm font-medium mb-4">Credenziali Admin del Locale</p>
              </div>

              {/* Email Admin */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Admin *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@ristorante.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Password Admin */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password Admin *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimo 8 caratteri"
                    className={inputClass}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrizione (opzionale)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Breve descrizione del locale..."
                    rows={3}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-secondary rounded-lg border-0 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-wine resize-none',
                      'placeholder:text-muted-foreground'
                    )}
                  />
                </div>
              </div>

              {/* Result Message */}
              {result.message && (
                <div
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg',
                    result.success
                      ? 'bg-green-900/20 text-green-400'
                      : 'bg-red-900/20 text-red-400'
                  )}
                >
                  {result.success ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">{result.message}</p>
                    {result.venue && (
                      <p className="text-sm opacity-80">
                        Slug: {result.venue.slug} | ID: {result.venue.id}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-wine hover:bg-wine-dark text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creazione in corso...' : 'Crea Locale'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
