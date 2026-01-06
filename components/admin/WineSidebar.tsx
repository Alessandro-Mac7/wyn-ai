'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wine, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseGrapeVarieties } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { WineCreateInput, WineType, WineWithRatings } from '@/types'

interface WineSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: WineCreateInput, wineId?: string) => Promise<void>
  editWine?: WineWithRatings | null
}

const wineTypes: { value: WineType; label: string }[] = [
  { value: 'red', label: 'Rosso' },
  { value: 'white', label: 'Bianco' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Spumante' },
  { value: 'dessert', label: 'Dessert' },
]

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 }
  }
} as const

const sidebarVariants = {
  hidden: {
    x: '100%',
    opacity: 0.8
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1] as const
    }
  }
}

export function WineSidebar({ isOpen, onClose, onSave, editWine }: WineSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isEditMode = !!editWine

  const getInitialFormData = () => ({
    name: '',
    wine_type: 'red' as WineType,
    price: '',
    price_glass: '',
    producer: '',
    region: '',
    denomination: '',
    grape_varieties: '',
    year: '',
    description: '',
  })

  const [formData, setFormData] = useState(getInitialFormData())

  // Focus first input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  // Populate form when editing, reset when closing or switching modes
  useEffect(() => {
    if (isOpen && editWine) {
      setFormData({
        name: editWine.name || '',
        wine_type: editWine.wine_type || 'red',
        price: editWine.price?.toString() || '',
        price_glass: editWine.price_glass?.toString() || '',
        producer: editWine.producer || '',
        region: editWine.region || '',
        denomination: editWine.denomination || '',
        grape_varieties: editWine.grape_varieties?.join(', ') || '',
        year: editWine.year?.toString() || '',
        description: editWine.description || '',
      })
    } else if (!isOpen) {
      setFormData(getInitialFormData())
    }
  }, [isOpen, editWine])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Year is required for all wine types except sparkling
  const isYearRequired = formData.wine_type !== 'sparkling'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price || !formData.producer) return
    if (isYearRequired && !formData.year) return

    setIsLoading(true)

    const input: WineCreateInput = {
      name: formData.name,
      wine_type: formData.wine_type,
      price: parseFloat(formData.price),
      price_glass: formData.price_glass
        ? parseFloat(formData.price_glass)
        : undefined,
      producer: formData.producer || undefined,
      region: formData.region || undefined,
      denomination: formData.denomination || undefined,
      grape_varieties: parseGrapeVarieties(formData.grape_varieties).length > 0
        ? parseGrapeVarieties(formData.grape_varieties)
        : undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      description: formData.description || undefined,
    }

    await onSave(input, editWine?.id)
    setIsLoading(false)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const inputClass = cn(
    'w-full h-10 px-3 bg-secondary rounded-lg border-0 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-wine',
    'placeholder:text-muted-foreground'
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
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
            aria-labelledby="sidebar-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                  <Wine className="h-5 w-5 text-wine" />
                </div>
                <h2 id="sidebar-title" className="text-lg font-semibold">
                  {isEditMode ? 'Modifica Vino' : 'Aggiungi Vino'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col h-[calc(100%-80px)]"
            >
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? 'Modifica i dettagli del vino. I campi con * sono obbligatori.'
                    : 'Inserisci i dettagli del nuovo vino. I campi con * sono obbligatori.'}
                </p>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome del vino *</label>
                  <input
                    ref={firstInputRef}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="es. Barolo Riserva 2018"
                    className={inputClass}
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipologia *</label>
                  <select
                    name="wine_type"
                    value={formData.wine_type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" disabled>Seleziona tipologia</option>
                    {wineTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prezzo bottiglia (€) *</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="45.00"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prezzo calice (€)</label>
                    <input
                      name="price_glass"
                      type="number"
                      step="0.01"
                      value={formData.price_glass}
                      onChange={handleChange}
                      placeholder="12.00"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Producer */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Produttore *</label>
                  <input
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                    placeholder="es. Cascina Francia"
                    className={inputClass}
                    required
                  />
                </div>

                {/* Region and Denomination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Regione</label>
                    <input
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder="es. Piemonte"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Denominazione</label>
                    <input
                      name="denomination"
                      value={formData.denomination}
                      onChange={handleChange}
                      placeholder="es. Barolo DOCG"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Year and Grapes */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Annata {isYearRequired && '*'}
                    </label>
                    <input
                      name="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={handleChange}
                      placeholder={isYearRequired ? '2020' : 'NV'}
                      className={inputClass}
                      required={isYearRequired}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Vitigni</label>
                    <input
                      name="grape_varieties"
                      value={formData.grape_varieties}
                      onChange={handleChange}
                      placeholder="es. Nebbiolo, Barbera"
                      className={inputClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  Inserisci i vitigni separati da virgola
                </p>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrizione</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descrivi il vino: note di degustazione, aromi, abbinamenti..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 bg-secondary rounded-lg border-0 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-wine resize-none',
                      'placeholder:text-muted-foreground'
                    )}
                  />
                </div>
              </div>

              {/* Actions - Fixed at bottom */}
              <div className="p-5 border-t border-border bg-card">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-wine hover:bg-wine-dark"
                    disabled={isLoading || !formData.name || !formData.price || !formData.producer || (isYearRequired && !formData.year)}
                  >
                    {isEditMode ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {isLoading ? 'Salvataggio...' : 'Aggiungi Vino'}
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
  )
}
