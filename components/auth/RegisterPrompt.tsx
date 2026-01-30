'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Shield, History } from 'lucide-react'
import { MagicLinkForm } from './MagicLinkForm'
import { useRegistrationPrompt } from '@/hooks/useUserProfile'

interface RegisterPromptProps {
  messageCount: number
  className?: string
}

export function RegisterPrompt({ messageCount, className = '' }: RegisterPromptProps) {
  const { shouldShowPrompt, dismissPrompt, canShowPrompt } = useRegistrationPrompt(messageCount)
  const [showForm, setShowForm] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    dismissPrompt()
  }, [dismissPrompt])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    // Form shows success message, then user will be redirected via email
  }, [])

  const handleFormCancel = useCallback(() => {
    setShowForm(false)
  }, [])

  // Don't render if dismissed or not eligible
  if (!shouldShowPrompt || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 safe-bottom ${className}`}
      >
        <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 transition-colors z-10"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>

          <AnimatePresence mode="wait">
            {!showForm ? (
              // Prompt content
              <motion.div
                key="prompt"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-wine/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-wine" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Salva le tue preferenze</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Registrati per ricevere consigli personalizzati
                    </p>
                  </div>
                </div>

                {/* Benefits list */}
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="w-3.5 h-3.5 text-wine" />
                    <span>Storico delle tue chat</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-wine" />
                    <span>Consigli personalizzati sui tuoi gusti</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-wine" />
                    <span>I tuoi dati sono al sicuro</span>
                  </li>
                </ul>

                {/* CTA button */}
                <button
                  onClick={handleShowForm}
                  className="w-full py-2.5 px-4 rounded-xl bg-wine text-white text-sm font-medium hover:bg-wine-dark transition-colors"
                >
                  Registrati gratis
                </button>

                {/* Skip text */}
                <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                  Solo la tua email, niente password
                </p>
              </motion.div>
            ) : (
              // Registration form
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4"
              >
                <h3 className="font-semibold text-sm mb-1">Registrati con email</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ti invieremo un link magico per accedere
                </p>
                <MagicLinkForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
