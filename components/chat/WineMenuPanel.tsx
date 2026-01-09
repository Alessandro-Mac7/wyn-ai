'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wine } from 'lucide-react'
import { WineMenuItem } from './WineMenuItem'
import { useRegisterPanel } from '@/contexts/panel-context'
import type { WineWithRatings } from '@/types'

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

  // Filter only available wines
  const availableWines = wines.filter(w => w.available)

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

            {/* Wine list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {availableWines.length > 0 ? (
                availableWines.map((wine) => (
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
                {availableWines.length} vini disponibili
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
