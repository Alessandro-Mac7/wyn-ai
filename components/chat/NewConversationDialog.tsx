'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { overlayVariants, modalVariants } from '@/lib/motion'

interface NewConversationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  messageCount: number
}

export function NewConversationDialog({
  isOpen,
  onConfirm,
  onCancel,
  messageCount,
}: NewConversationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="relative w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-conversation-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wine/20">
                    <RefreshCcw className="h-5 w-5 text-wine" />
                  </div>
                  <h2 id="new-conversation-title" className="text-lg font-semibold">
                    Nuova conversazione?
                  </h2>
                </div>
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-muted-foreground mb-6">
                  La conversazione attuale ({messageCount} {messageCount === 1 ? 'messaggio' : 'messaggi'}) verrà cancellata.
                  {messageCount > 0 && ' Il locale selezionato rimarrà attivo.'}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                  >
                    Annulla
                  </Button>
                  <Button
                    className="flex-1 bg-wine hover:bg-wine-dark text-white"
                    onClick={onConfirm}
                  >
                    Nuova conversazione
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
