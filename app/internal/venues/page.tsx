'use client'

import { useState, useEffect, FormEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Building2, Mail, Lock, FileText, Check, AlertCircle, LogOut,
  MapPin, Navigation, Plus, List, Pencil, X, Loader2, Wine
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VenueData {
  id: string
  slug: string
  name: string
  email: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  created_at: string
}

interface FormData {
  name: string
  slug: string
  email: string
  password: string
  description: string
  latitude: string
  longitude: string
  address: string
  city: string
}

interface EditFormData {
  id: string
  name: string
  description: string
  latitude: string
  longitude: string
  address: string
  city: string
}

interface Result {
  success?: boolean
  message?: string
  venue?: { id: string; slug: string; name: string }
}

type TabType = 'list' | 'new'

export default function VenueManagementPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('list')

  // Venues list state
  const [venues, setVenues] = useState<VenueData[]>([])
  const [loadingVenues, setLoadingVenues] = useState(true)

  // Edit modal state
  const [editingVenue, setEditingVenue] = useState<VenueData | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    id: '',
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // New venue form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    email: '',
    password: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<Result>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Fetch venues
  const fetchVenues = useCallback(async () => {
    setLoadingVenues(true)
    try {
      const res = await fetch('/api/internal/venues')
      if (res.ok) {
        const data = await res.json()
        setVenues(data.venues || [])
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoadingVenues(false)
    }
  }, [])

  // Get user email on mount and fetch venues
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    fetchVenues()
  }, [supabase, fetchVenues])

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
          latitude: '',
          longitude: '',
          address: '',
          city: '',
        })
        // Refresh venues list
        fetchVenues()
        // Switch to list tab
        setTimeout(() => setActiveTab('list'), 1500)
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

  // Edit handlers
  const openEditModal = (venue: VenueData) => {
    setEditingVenue(venue)
    setEditFormData({
      id: venue.id,
      name: venue.name,
      description: venue.description || '',
      latitude: venue.latitude?.toString() || '',
      longitude: venue.longitude?.toString() || '',
      address: venue.address || '',
      city: venue.city || '',
    })
    setEditError(null)
  }

  const closeEditModal = () => {
    setEditingVenue(null)
    setEditError(null)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSavingEdit(true)
    setEditError(null)

    try {
      const res = await fetch('/api/internal/venues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await res.json()

      if (res.ok) {
        // Update local state
        setVenues(prev => prev.map(v =>
          v.id === editFormData.id ? { ...v, ...data.venue } : v
        ))
        closeEditModal()
      } else {
        setEditError(data.error || 'Errore durante il salvataggio')
      }
    } catch (error) {
      console.error('Error saving venue:', error)
      setEditError('Errore di connessione')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const inputClass = cn(
    'w-full h-11 pl-10 pr-4 bg-secondary rounded-lg border-0 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-wine',
    'placeholder:text-muted-foreground'
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wyn-icon.ico"
              alt="WYN"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="mina-regular text-lg">SUPER ADMIN</span>
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
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'list'
                ? 'bg-wine text-white'
                : 'bg-secondary hover:bg-secondary/80'
            )}
          >
            <List className="h-4 w-4" />
            Locali ({venues.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'new'
                ? 'bg-wine text-white'
                : 'bg-secondary hover:bg-secondary/80'
            )}
          >
            <Plus className="h-4 w-4" />
            Nuovo Locale
          </button>
        </div>

        {/* List Tab */}
        {activeTab === 'list' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                  <Building2 className="h-5 w-5 text-wine" />
                </div>
                <div>
                  <h1 className="mina-regular text-xl">LOCALI REGISTRATI</h1>
                  <p className="text-sm text-muted-foreground">
                    Gestisci i ristoranti sulla piattaforma
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingVenues ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : venues.length === 0 ? (
                <div className="text-center py-12">
                  <Wine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nessun locale registrato</p>
                  <Button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 bg-wine hover:bg-wine-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi il primo locale
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium truncate">{venue.name}</h3>
                          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                            /{venue.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {venue.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {venue.email}
                            </span>
                          )}
                          {venue.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {venue.city}
                            </span>
                          )}
                          {venue.latitude && venue.longitude && (
                            <span className="flex items-center gap-1 text-green-500">
                              <Navigation className="h-3 w-3" />
                              GPS
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openEditModal(venue)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-background rounded-lg hover:bg-wine hover:text-white transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifica
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Venue Tab */}
        {activeTab === 'new' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-wine/20">
                  <Plus className="h-6 w-6 text-wine" />
                </div>
                <div>
                  <h1 className="mina-regular text-2xl">NUOVO LOCALE</h1>
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
                </div>

                {/* Divider - Credentials */}
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
                  <p className="text-xs text-muted-foreground">
                    Deve contenere maiuscola, minuscola e numero
                  </p>
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

                {/* Location Section */}
                <div className="border-t border-border pt-6">
                  <p className="text-sm font-medium mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-wine" />
                    Posizione (opzionale)
                  </p>
                </div>

                {/* Address & City */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Indirizzo</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Via Roma 123"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Città</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Milano"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitudine</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        name="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="45.4642"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitudine</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rotate-90" />
                      <input
                        name="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="9.1900"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Trova le coordinate su Google Maps: tasto destro → "Cosa c'è qui?"
                </p>

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
        )}
      </main>

      {/* Edit Modal */}
      {editingVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeEditModal}
          />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                  <Pencil className="h-5 w-5 text-wine" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Modifica Locale</h2>
                  <p className="text-sm text-muted-foreground">{editingVenue.slug}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Locale</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrizione</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    rows={2}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-secondary rounded-lg border-0 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-wine resize-none',
                      'placeholder:text-muted-foreground'
                    )}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-wine" />
                  Posizione
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Indirizzo</label>
                  <input
                    name="address"
                    value={editFormData.address}
                    onChange={handleEditChange}
                    placeholder="Via Roma 123"
                    className={cn(inputClass, 'pl-4')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Città</label>
                  <input
                    name="city"
                    value={editFormData.city}
                    onChange={handleEditChange}
                    placeholder="Milano"
                    className={cn(inputClass, 'pl-4')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitudine</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={editFormData.latitude}
                    onChange={handleEditChange}
                    placeholder="45.4642"
                    className={cn(inputClass, 'pl-4')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitudine</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={editFormData.longitude}
                    onChange={handleEditChange}
                    placeholder="9.1900"
                    className={cn(inputClass, 'pl-4')}
                  />
                </div>
              </div>

              {/* Error */}
              {editError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {editError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeEditModal}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-wine hover:bg-wine-dark"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva Modifiche'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
