'use client'

import { motion } from 'framer-motion'
import { MapPin, Wine, X, Info, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Venue, WineType } from '@/types'

interface VenueHeaderProps {
  venue: Venue
  wineStats?: { total: number; types: number }
  selectedTypes: WineType[]
  onFilterChange: (types: WineType[]) => void
  onClose: () => void
  onInfoToggle?: () => void
  onWineMenuToggle?: () => void
  isInfoExpanded?: boolean
}

const wineTypeFilters: { value: WineType; label: string }[] = [
  { value: 'red', label: 'Rosso' },
  { value: 'white', label: 'Bianco' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Spumante' },
  { value: 'dessert', label: 'Dessert' },
]

export function VenueHeader({
  venue,
  wineStats,
  selectedTypes,
  onFilterChange,
  onClose,
  onInfoToggle,
  onWineMenuToggle,
  isInfoExpanded,
}: VenueHeaderProps) {
  const toggleFilter = (type: WineType) => {
    if (selectedTypes.includes(type)) {
      onFilterChange(selectedTypes.filter((t) => t !== type))
    } else {
      onFilterChange([...selectedTypes, type])
    }
  }

  return (
    <motion.header
      className="sticky top-0 z-20 glass shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
    >
      <div className="px-4 py-3">
        {/* Top row: Badge, Name, Stats, Close */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {/* Locale badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-wine/20 text-wine border border-wine/30">
              <MapPin className="h-3 w-3" />
              Locale
            </span>
            {/* Venue name */}
            <h1 className="mina-regular text-lg uppercase">{venue.name}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Stats */}
            {wineStats && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="text-wine font-semibold">{wineStats.total}</span>
                <span className="text-muted-foreground">Vini</span>
                <span className="text-wine font-semibold">{wineStats.types}</span>
                <span className="text-muted-foreground">Tipi</span>
              </div>
            )}

            {/* Info toggle button */}
            {onInfoToggle && (
              <button
                onClick={onInfoToggle}
                className={cn(
                  "p-2 rounded-lg transition-colors btn-press",
                  isInfoExpanded
                    ? "bg-wine/20 text-wine"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
                aria-label={isInfoExpanded ? "Nascondi info locale" : "Mostra info locale"}
                aria-expanded={isInfoExpanded}
              >
                <Info className="h-4 w-4" />
              </button>
            )}

            {/* Wine menu button */}
            {onWineMenuToggle && (
              <button
                onClick={onWineMenuToggle}
                className="p-2 hover:bg-secondary rounded-lg transition-colors btn-press text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                aria-label="Apri carta dei vini"
              >
                <BookOpen className="h-4 w-4" />
                {wineStats && (
                  <span className="text-xs font-medium hidden sm:inline">{wineStats.total}</span>
                )}
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors btn-press"
              aria-label="Chiudi modalità venue"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtri tipo vino">
          {/* All wines button (reset) */}
          <motion.button
            onClick={() => onFilterChange([])}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-xs font-medium rounded-full border',
              'transition-all duration-150 min-h-[32px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
              selectedTypes.length === 0
                ? 'bg-wine/20 border-wine text-wine'
                : 'border-border hover:border-wine/50 text-foreground/70'
            )}
            role="checkbox"
            aria-checked={selectedTypes.length === 0}
            aria-label="Mostra tutti i vini"
          >
            <Wine className="h-3.5 w-3.5" />
            Tutti
          </motion.button>

          {wineTypeFilters.map((filter) => {
            const isActive = selectedTypes.includes(filter.value)
            return (
              <motion.button
                key={filter.value}
                onClick={() => toggleFilter(filter.value)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5',
                  'text-xs font-medium rounded-full border',
                  'transition-all duration-150 min-h-[32px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine',
                  isActive
                    ? 'bg-wine/20 border-wine text-wine'
                    : 'border-border hover:border-wine/50 text-foreground/70'
                )}
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Filtra per ${filter.label}`}
              >
                <Wine className="h-3.5 w-3.5" />
                {filter.label}
              </motion.button>
            )
          })}

          {/* Active filter count */}
          {selectedTypes.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {selectedTypes.length} filtro{selectedTypes.length !== 1 ? 'i' : ''} attivo{selectedTypes.length !== 1 ? 'i' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.header>
  )
}
