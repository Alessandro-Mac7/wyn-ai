'use client'

import { useState, FormEvent } from 'react'
import { X, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseGrapeVarieties } from '@/lib/utils'
import { useRegisterPanel } from '@/contexts/panel-context'
import type { WineCreateInput, WineType } from '@/types'

interface WineModalProps {
  onClose: () => void
  onSave: (input: WineCreateInput) => Promise<void>
}

const wineTypes: { value: WineType; label: string }[] = [
  { value: 'red', label: 'Rosso' },
  { value: 'white', label: 'Bianco' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Spumante' },
  { value: 'dessert', label: 'Dessert' },
]

export function WineModal({ onClose, onSave }: WineModalProps) {
  // Register panel for z-index coordination (always true when mounted)
  useRegisterPanel('wine-modal', true)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

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

    await onSave(input)
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

  const inputClass =
    'w-full h-10 px-3 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="sticky top-0 bg-card flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
              <Wine className="h-5 w-5 text-wine" />
            </div>
            <h2 className="text-lg font-semibold">Aggiungi Vino</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            Inserisci i dettagli del nuovo vino. I campi con * sono obbligatori.
          </p>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome del vino *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="es. Barolo Riserva 2018"
              className={inputClass}
              required
            />
          </div>

          {/* Type and Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipologia *</label>
              <select
                name="wine_type"
                value={formData.wine_type}
                onChange={handleChange}
                className={inputClass}
              >
                {wineTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Annata</label>
              <input
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                placeholder="es. 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                className={inputClass}
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prezzo bottiglia *</label>
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
              <label className="text-sm font-medium">Prezzo calice</label>
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

          {/* Producer and Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Produttore</label>
              <input
                name="producer"
                value={formData.producer}
                onChange={handleChange}
                placeholder="es. Cascina Francia"
                className={inputClass}
              />
            </div>

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
          </div>

          {/* Denomination and Grapes */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrizione</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrivi il vino: note di degustazione, aromi, abbinamenti..."
              rows={3}
              className="w-full px-3 py-2 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              disabled={isLoading}
            >
              <Wine className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvataggio...' : 'Aggiungi Vino'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
