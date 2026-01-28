'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ScanLine } from 'lucide-react'
import { LabelScanner } from './LabelScanner'
import { cn } from '@/lib/utils'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
} as const

const panelVariants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
} as const

interface ScanPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ScanPanel({ isOpen, onClose }: ScanPanelProps) {
  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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
            className={cn(
              'fixed inset-y-0 right-0 z-[70]',
              'w-full sm:w-[400px] max-w-full',
              'bg-card border-l border-border',
              'flex flex-col',
              'shadow-[-8px_0_32px_rgba(0,0,0,0.3)]'
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-panel-title"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <ScanLine className="h-4 w-4 text-wine" />
                </div>
                <h2 id="scan-panel-title" className="text-base font-semibold">
                  Scansiona Etichetta
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

            {/* Content */}
            <LabelScanner />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
