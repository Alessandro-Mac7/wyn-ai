'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, X } from 'lucide-react'
import { OtpLoginForm } from '@/components/auth/OtpLoginForm'
import { useRegisterPanel } from '@/contexts/panel-context'
import { panelSlideVariants, backdropVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface LoginPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginPanel({ isOpen, onClose }: LoginPanelProps) {
  useRegisterPanel('login-panel', isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] glass-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className={cn(
              'fixed inset-y-0 right-0 z-[70]',
              'w-full sm:w-[380px] max-w-full',
              'glass-panel',
              'flex flex-col safe-top safe-bottom'
            )}
            variants={panelSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-panel-title"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <LogIn className="h-4 w-4 text-wine" />
                </div>
                <h2 id="login-panel-title" className="text-base font-semibold">
                  Accedi a WYN
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 glass-hover rounded-lg"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-6">
                Inserisci la tua email e ti invieremo un codice di verifica per accedere.
              </p>

              <OtpLoginForm
                onSuccess={(isNewUser) => {
                  if (isNewUser) {
                    window.location.href = '/auth/confirm?new=true'
                  } else {
                    onClose()
                  }
                }}
                onCancel={onClose}
                showConsent={true}
              />

              {/* Benefits */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground">
                  Con un account puoi:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-wine" />
                    Salvare le tue preferenze di vino
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-wine" />
                    Accedere allo storico delle chat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-wine" />
                    Ricevere consigli personalizzati
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
