'use client'

import { useState, useEffect, FormEvent, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Mail, LogOut, Settings,
  MapPin, Navigation, Plus, Pencil, X, Loader2, Wine, Search, Save, Check
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'
import { Button } from '@/components/ui/button'
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

// Animation variants for sidebar
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
} as const

const sidebarVariants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const }
  }
} as const

export default function VenueManagementPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Venues list state
  const [venues, setVenues] = useState<VenueData[]>([])
  const [loadingVenues, setLoadingVenues] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false)
  const [editingVenue, setEditingVenue] = useState<VenueData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form data
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
  const [editFormData, setEditFormData] = useState<EditFormData>({
    id: '',
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
  })

  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Settings state
  const [maxVenueDistance, setMaxVenueDistance] = useState<string>('50')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

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

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.max_venue_distance_km !== undefined) {
          setMaxVenueDistance(String(data.settings.max_venue_distance_km))
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [])

  // Save max distance setting
  const saveMaxDistance = async () => {
    setSavingSettings(true)
    setSettingsSaved(false)
    try {
      const res = await fetch('/api/internal/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'max_venue_distance_km',
          value: parseFloat(maxVenueDistance) || 0
        }),
      })
      if (res.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  // Get user email on mount and fetch venues/settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    fetchVenues()
    fetchSettings()
  }, [supabase, fetchVenues, fetchSettings])

  // Focus first input when sidebar opens
  useEffect(() => {
    if (showSidebar) {
      setTimeout(() => firstInputRef.current?.focus(), 300)
    }
  }, [showSidebar])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSidebar) {
        closeSidebar()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showSidebar])

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

  // Open sidebar for new venue
  const openNewVenueSidebar = () => {
    setEditingVenue(null)
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
    setSaveError(null)
    setShowSidebar(true)
  }

  // Open sidebar for editing
  const openEditSidebar = (venue: VenueData) => {
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
    setSaveError(null)
    setShowSidebar(true)
  }

  const closeSidebar = () => {
    setShowSidebar(false)
    setEditingVenue(null)
    setSaveError(null)
  }

  // Handle form changes
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

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  // Submit new venue
  const handleSubmitNew = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch('/api/internal/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        fetchVenues()
        closeSidebar()
      } else {
        setSaveError(data.error || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Error creating venue:', error)
      setSaveError('Errore di connessione')
    } finally {
      setIsSaving(false)
    }
  }

  // Submit edit
  const handleSubmitEdit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch('/api/internal/venues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await res.json()

      if (res.ok) {
        setVenues(prev => prev.map(v =>
          v.id === editFormData.id ? { ...v, ...data.venue } : v
        ))
        closeSidebar()
      } else {
        setSaveError(data.error || 'Errore durante il salvataggio')
      }
    } catch (error) {
      console.error('Error saving venue:', error)
      setSaveError('Errore di connessione')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter venues by search
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const inputClass = cn(
    'w-full h-10 px-3 bg-secondary rounded-lg border-0 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-wine',
    'placeholder:text-muted-foreground'
  )

  const isEditMode = !!editingVenue

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        {/* Settings Card */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                <Settings className="h-5 w-5 text-wine" />
              </div>
              <div>
                <h2 className="font-semibold">Impostazioni Piattaforma</h2>
                <p className="text-sm text-muted-foreground">Configurazione globale</p>
              </div>
            </div>
            <Button
              onClick={saveMaxDistance}
              disabled={savingSettings}
              size="sm"
              className={cn(
                "transition-all",
                settingsSaved
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-wine hover:bg-wine-dark"
              )}
            >
              {savingSettings ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : settingsSaved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {settingsSaved ? 'Salvato!' : 'Salva'}
            </Button>
          </div>

          <div className="max-w-xs">
            <label className="text-sm font-medium mb-2 block">
              Distanza massima GPS (km)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={maxVenueDistance}
                onChange={(e) => setMaxVenueDistance(e.target.value)}
                className="w-full h-10 px-3 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine"
              />
              <span className="text-sm text-muted-foreground">km</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              0 = controllo disabilitato
            </p>
          </div>
        </div>

        {/* Title and Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mina-regular text-3xl">GESTIONE LOCALI</h1>
            <p className="text-muted-foreground">
              {venues.length} locali registrati
            </p>
          </div>
          <Button
            onClick={openNewVenueSidebar}
            className="bg-wine hover:bg-wine-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Locale
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca locali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine"
            />
          </div>
        </div>

        {/* Loading state */}
        {loadingVenues && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-secondary rounded w-3/4 mb-3" />
                <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Venue Grid */}
        {!loadingVenues && filteredVenues.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-wine/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                      <Building2 className="h-5 w-5 text-wine" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{venue.name}</h3>
                      <span className="text-xs text-muted-foreground">/{venue.slug}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditSidebar(venue)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    aria-label="Modifica"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {venue.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{venue.email}</span>
                    </div>
                  )}
                  {venue.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{venue.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Navigation className={cn(
                      "h-3.5 w-3.5",
                      venue.latitude && venue.longitude ? "text-green-500" : "text-muted-foreground/50"
                    )} />
                    <span className={venue.latitude && venue.longitude ? "text-green-500" : "text-muted-foreground/50"}>
                      {venue.latitude && venue.longitude ? 'GPS configurato' : 'GPS non configurato'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingVenues && filteredVenues.length === 0 && (
          <div className="text-center py-16">
            <Wine className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Nessun locale trovato con questa ricerca'
                : 'Nessun locale registrato'}
            </p>
            {!searchQuery && (
              <Button
                onClick={openNewVenueSidebar}
                className="bg-wine hover:bg-wine-dark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi il primo locale
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeSidebar}
            />

            {/* Sidebar */}
            <motion.div
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                    <Building2 className="h-5 w-5 text-wine" />
                  </div>
                  <h2 className="text-lg font-semibold">
                    {isEditMode ? 'Modifica Locale' : 'Aggiungi Locale'}
                  </h2>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={isEditMode ? handleSubmitEdit : handleSubmitNew}
                className="flex flex-col h-[calc(100%-80px)]"
              >
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                  <p className="text-sm text-muted-foreground">
                    {isEditMode
                      ? 'Modifica i dettagli del locale. I campi con * sono obbligatori.'
                      : 'Inserisci i dettagli del nuovo locale. I campi con * sono obbligatori.'}
                  </p>

                  {isEditMode ? (
                    // Edit Form
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Locale *</label>
                        <input
                          ref={firstInputRef}
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditChange}
                          className={inputClass}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descrizione</label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditChange}
                          rows={3}
                          className={cn(inputClass, 'h-auto py-2 resize-none')}
                        />
                      </div>

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
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Città</label>
                          <input
                            name="city"
                            value={editFormData.city}
                            onChange={handleEditChange}
                            placeholder="Milano"
                            className={inputClass}
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
                            className={inputClass}
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
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trova le coordinate su Google Maps: tasto destro → &quot;Cosa c&apos;è qui?&quot;
                      </p>
                    </>
                  ) : (
                    // New Venue Form
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Locale *</label>
                        <input
                          ref={firstInputRef}
                          name="name"
                          value={formData.name}
                          onChange={handleNameChange}
                          placeholder="es. Osteria del Vino Buono"
                          className={inputClass}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Slug URL *</label>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-1">/v/</span>
                          <input
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="osteria-vino-buono"
                            className={inputClass}
                            required
                            pattern="[a-z0-9-]+"
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-3">Credenziali Admin</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Admin *</label>
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password Admin *</label>
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
                        <p className="text-xs text-muted-foreground">
                          Maiuscola, minuscola e numero
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Descrizione</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Breve descrizione..."
                          rows={2}
                          className={cn(inputClass, 'h-auto py-2 resize-none')}
                        />
                      </div>

                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-wine" />
                          Posizione (opzionale)
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Indirizzo</label>
                          <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Via Roma 123"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Città</label>
                          <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Milano"
                            className={inputClass}
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
                            value={formData.latitude}
                            onChange={handleChange}
                            placeholder="45.4642"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Longitudine</label>
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
                    </>
                  )}

                  {/* Error message */}
                  {saveError && (
                    <div className="flex items-center gap-2 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm">
                      <X className="h-4 w-4 flex-shrink-0" />
                      {saveError}
                    </div>
                  )}
                </div>

                {/* Actions - Fixed at bottom */}
                <div className="p-5 border-t border-border bg-card">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeSidebar}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-wine hover:bg-wine-dark"
                      disabled={isSaving}
                    >
                      {isEditMode ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {isSaving ? 'Creazione...' : 'Crea Locale'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
