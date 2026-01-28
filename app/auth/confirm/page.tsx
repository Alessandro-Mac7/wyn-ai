'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, ArrowRight, User } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth'

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmPageLoading />}>
      <ConfirmPageContent />
    </Suspense>
  )
}

function ConfirmPageLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Image
          src="/wyn-icon.ico"
          alt="WYN"
          width={48}
          height={48}
          className="w-12 h-12 animate-toast mx-auto"
          priority
        />
        <p className="mt-4 text-sm text-muted-foreground">Verifica in corso...</p>
        <p className="mt-2 text-xs text-muted-foreground/60">
          Stiamo confermando il tuo accesso
        </p>
      </motion.div>
    </div>
  )
}

function ConfirmPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewUser = searchParams.get('new') === 'true'
  const error = searchParams.get('error')

  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto redirect for returning users
  useEffect(() => {
    if (!isNewUser && !error) {
      router.push('/chat')
    }
  }, [isNewUser, error, router])

  const handleContinue = async () => {
    setIsLoading(true)
    setSaveError(null)

    try {
      // Get current user
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Sessione non valida')
      }

      // Check for pending GDPR consent from registration
      const pendingConsent = localStorage.getItem('wyn_pending_gdpr_consent')

      // Build update object
      const updateData: Record<string, unknown> = {}

      if (displayName.trim()) {
        updateData.display_name = displayName.trim()
      }

      // Record GDPR consent timestamp if user consented during registration
      if (pendingConsent === 'true') {
        updateData.gdpr_consent_at = new Date().toISOString()
        localStorage.removeItem('wyn_pending_gdpr_consent')
      }

      // Update profile if there are changes
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Profile update error:', updateError)
          // Non-blocking error - continue anyway
        }
      }

      // Redirect to chat
      router.push('/chat')
    } catch (err) {
      console.error('Continue error:', err)
      setSaveError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    // Still capture GDPR consent even if skipping name
    const pendingConsent = localStorage.getItem('wyn_pending_gdpr_consent')
    if (pendingConsent === 'true') {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ gdpr_consent_at: new Date().toISOString() })
            .eq('user_id', user.id)
        }
        localStorage.removeItem('wyn_pending_gdpr_consent')
      } catch (err) {
        console.error('Error saving consent on skip:', err)
      }
    }
    router.push('/chat')
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          className="w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Errore di autenticazione</h1>
          <p className="text-muted-foreground mb-6">{decodeURIComponent(error)}</p>
          <button
            onClick={() => router.push('/chat')}
            className="w-full py-3 px-4 rounded-xl bg-card border border-white/10 text-foreground font-medium hover:bg-card/80 transition-colors"
          >
            Torna alla chat
          </button>
        </motion.div>
      </div>
    )
  }

  // New user welcome
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Benvenuto in WYN!</h1>
          <p className="text-muted-foreground">
            Il tuo account è stato creato con successo.
          </p>
        </div>

        {/* Optional: Set display name */}
        <div className="space-y-4">
          <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <label className="block text-sm font-medium mb-2">
              Come preferisci essere chiamato? <span className="text-muted-foreground">(opzionale)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Il tuo nome"
                maxLength={50}
                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-wine/50"
              />
            </div>
            {displayName && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {displayName.length}/50 caratteri
              </p>
            )}
          </div>

          {/* Error message */}
          {saveError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {saveError}
            </motion.p>
          )}

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-wine text-white font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Salvataggio...</span>
            ) : (
              <>
                <span>Inizia a esplorare</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Salta per ora
          </button>
        </div>

        {/* Features hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Con un account puoi salvare le tue preferenze e accedere allo storico delle tue chat.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
