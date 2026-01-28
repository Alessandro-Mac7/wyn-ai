'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { signInWithMagicLink } from '@/lib/supabase-auth'

interface MagicLinkFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  redirectTo?: string
  className?: string
  showConsent?: boolean
}

export function MagicLinkForm({
  onSuccess,
  onCancel,
  redirectTo,
  className = '',
  showConsent = true,
}: MagicLinkFormProps) {
  const [email, setEmail] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || isLoading) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Inserisci un indirizzo email valido')
      return
    }

    // GDPR consent required
    if (showConsent && !gdprConsent) {
      setError('Devi accettare la Privacy Policy per continuare')
      return
    }

    setIsLoading(true)
    setError(null)

    // Store consent flag in localStorage to be captured after callback
    if (showConsent && gdprConsent) {
      localStorage.setItem('wyn_pending_gdpr_consent', 'true')
    }

    const result = await signInWithMagicLink({
      email: email.trim(),
      redirectTo,
    })

    setIsLoading(false)

    if (result.success) {
      setSent(true)
      onSuccess?.()
    } else {
      setError(result.error || 'Errore durante invio')
      localStorage.removeItem('wyn_pending_gdpr_consent')
    }
  }, [email, isLoading, redirectTo, onSuccess, gdprConsent, showConsent])

  const handleResend = useCallback(() => {
    setSent(false)
    setError(null)
  }, [])

  // Success state - email sent
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center ${className}`}
      >
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Email inviata!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Abbiamo inviato un link magico a<br />
          <span className="text-foreground font-medium">{email}</span>
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Controlla la tua casella email e clicca sul link per accedere.
          <strong className="text-foreground"> Il link scade tra 60 minuti.</strong>
          {' '}Se non vedi la email, controlla la cartella spam.
        </p>
        <button
          onClick={handleResend}
          className="text-sm text-wine hover:text-wine-light transition-colors flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rinvia email
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        {/* Email input */}
        <div>
          <label htmlFor="magic-link-email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="magic-link-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tua@email.com"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-background/50 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-wine/50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* GDPR Consent checkbox */}
        {showConsent && (
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="gdpr-consent"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              disabled={isLoading}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-background/50 text-wine focus:ring-wine/50 focus:ring-offset-0"
            />
            <label htmlFor="gdpr-consent" className="text-xs text-muted-foreground">
              Ho letto e accetto la{' '}
              <Link href="/privacy" className="text-wine hover:text-wine-light underline">
                Privacy Policy
              </Link>
              {' '}e i{' '}
              <Link href="/terms" className="text-wine hover:text-wine-light underline">
                Termini di Servizio
              </Link>
            </label>
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full py-3 px-4 rounded-xl bg-wine text-white font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Invio in corso...</span>
            </>
          ) : (
            <span>Invia link magico</span>
          )}
        </button>

        {/* Cancel button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
        )}
      </div>
    </form>
  )
}
