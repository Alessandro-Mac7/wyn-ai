'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wine } from 'lucide-react'
import { WineMenuItem } from './WineMenuItem'
import { useRegisterPanel } from '@/contexts/panel-context'
import { cn } from '@/lib/utils'
import type { WineWithRatings, WineType } from '@/types'

// Wine type display config
const wineTypeConfig: Record<WineType, { label: string; color: string; bg: string }> = {
  red: { label: 'Rosso', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  white: { label: 'Bianco', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  rose: { label: 'Rosé', color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-500/30' },
  sparkling: { label: 'Bollicine', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
  dessert: { label: 'Dessert', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
}

interface WineMenuPanelProps {
  isOpen: boolean
  onClose: () => void
  wines: WineWithRatings[]
  venueName: string
}

// Animation variants (same as WineSidebar)
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
} as const

const panelVariants = {
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
}

export function WineMenuPanel({ isOpen, onClose, wines, venueName }: WineMenuPanelProps) {
  // Register panel for z-index coordination
  useRegisterPanel('wine-menu-panel', isOpen)

  // Filter state
  const [selectedType, setSelectedType] = useState<WineType | null>(null)

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

  // Reset filter when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
    }
  }, [isOpen])

  // Filter only available wines
  const availableWines = wines.filter(w => w.available)

  // Get available wine types (only types that have wines)
  const availableTypes = useMemo(() => {
    const types = new Set<WineType>()
    availableWines.forEach(wine => types.add(wine.wine_type))
    // Return in preferred order
    return (['red', 'white', 'rose', 'sparkling', 'dessert'] as WineType[]).filter(t => types.has(t))
  }, [availableWines])

  // Filter wines by selected type
  const filteredWines = useMemo(() => {
    if (!selectedType) return availableWines
    return availableWines.filter(wine => wine.wine_type === selectedType)
  }, [availableWines, selectedType])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 z-[70] h-full w-full sm:max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wine-panel-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                  <Wine className="h-5 w-5 text-wine" />
                </div>
                <div>
                  <h2 id="wine-panel-title" className="text-lg font-semibold">
                    Carta dei Vini
                  </h2>
                  <p className="text-sm text-muted-foreground">{venueName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter buttons */}
            {availableTypes.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setSelectedType(null)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    !selectedType
                      ? "bg-wine/20 border-wine text-wine"
                      : "border-border text-muted-foreground hover:border-wine/50 hover:text-foreground"
                  )}
                >
                  Tutti ({availableWines.length})
                </button>
                {availableTypes.map(type => {
                  const config = wineTypeConfig[type]
                  const count = availableWines.filter(w => w.wine_type === type).length
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        selectedType === type
                          ? `${config.bg} ${config.color}`
                          : "border-border text-muted-foreground hover:border-wine/50 hover:text-foreground"
                      )}
                    >
                      <Wine className="h-3 w-3" />
                      {config.label} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {/* Wine list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {filteredWines.length > 0 ? (
                filteredWines.map((wine) => (
                  <WineMenuItem key={wine.id} wine={wine} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nessun vino disponibile al momento.
                  </p>
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="p-4 border-t border-border flex-shrink-0 bg-card">
              <p className="text-sm text-muted-foreground text-center">
                {selectedType
                  ? `${filteredWines.length} di ${availableWines.length} vini`
                  : `${availableWines.length} vini disponibili`}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
