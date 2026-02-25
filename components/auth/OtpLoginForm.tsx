'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { sendOtpCode, verifyOtpCode } from '@/lib/supabase-auth'

interface OtpLoginFormProps {
  onSuccess?: (isNewUser: boolean) => void
  onCancel?: () => void
  className?: string
  showConsent?: boolean
}

const OTP_LENGTH = 8
const OTP_EXPIRY_MINUTES = 10
const RESEND_COOLDOWN = 60

export function OtpLoginForm({
  onSuccess,
  onCancel,
  className = '',
  showConsent = true,
}: OtpLoginFormProps) {
  // Step state
  const [step, setStep] = useState<'email' | 'code'>('email')

  // Email step
  const [email, setEmail] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Code step
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Shared
  const [error, setError] = useState<string | null>(null)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (expiryCountdown <= 0) return
    const timer = setTimeout(() => setExpiryCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [expiryCountdown])

  // Auto-focus first digit input when entering code step
  useEffect(() => {
    if (step === 'code') {
      requestAnimationFrame(() => inputRefs.current[0]?.focus())
    }
  }, [step])

  // ── Step 1: Send OTP ──────────────────────────────

  const handleSendCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || isSending) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Inserisci un indirizzo email valido')
      return
    }

    if (showConsent && !gdprConsent) {
      setError('Devi accettare la Privacy Policy per continuare')
      return
    }

    setIsSending(true)
    setError(null)

    // Store GDPR consent for post-login capture
    if (showConsent && gdprConsent) {
      localStorage.setItem('wyn_pending_gdpr_consent', 'true')
    }

    const result = await sendOtpCode(email.trim())

    setIsSending(false)

    if (result.success) {
      setStep('code')
      setCountdown(RESEND_COOLDOWN)
      setExpiryCountdown(OTP_EXPIRY_MINUTES * 60)
    } else {
      setError(result.error || 'Errore durante l\'invio del codice')
      localStorage.removeItem('wyn_pending_gdpr_consent')
    }
  }, [email, isSending, showConsent, gdprConsent])

  // ── Step 2: Verify OTP ────────────────────────────

  const handleDigitChange = useCallback((index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits(prev => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    setError(null)

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const newDigits = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)
    setError(null)

    // Focus last filled or first empty
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }, [])

  const handleVerify = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const code = digits.join('')
    if (code.length !== OTP_LENGTH || isVerifying) return

    setIsVerifying(true)
    setError(null)

    const result = await verifyOtpCode(email.trim(), code)

    setIsVerifying(false)

    if (result.success) {
      onSuccess?.(result.isNewUser)
    } else {
      setError(result.error || 'Codice non valido')
      // Clear digits on error so user can re-enter
      setDigits(Array(OTP_LENGTH).fill(''))
      requestAnimationFrame(() => inputRefs.current[0]?.focus())
    }
  }, [digits, isVerifying, email, onSuccess])

  // Auto-submit when all digits filled
  useEffect(() => {
    const code = digits.join('')
    if (code.length === OTP_LENGTH && step === 'code' && !isVerifying) {
      handleVerify()
    }
  }, [digits, step, isVerifying, handleVerify])

  const handleResend = useCallback(async () => {
    if (countdown > 0 || isSending) return
    setIsSending(true)
    setError(null)

    const result = await sendOtpCode(email.trim())

    setIsSending(false)

    if (result.success) {
      setCountdown(RESEND_COOLDOWN)
      setExpiryCountdown(OTP_EXPIRY_MINUTES * 60)
      setDigits(Array(OTP_LENGTH).fill(''))
    } else {
      setError(result.error || 'Errore durante il rinvio')
    }
  }, [countdown, isSending, email])

  const handleChangeEmail = useCallback(() => {
    setStep('email')
    setDigits(Array(OTP_LENGTH).fill(''))
    setError(null)
    setCountdown(0)
  }, [])

  // ── Render: Email Step ────────────────────────────

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className={className}>
        <div className="space-y-4">
          {/* Email input */}
          <div>
            <label htmlFor="otp-email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="otp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@email.com"
                disabled={isSending}
                autoComplete="email"
                autoFocus
                className="w-full pl-10 pr-4 py-3 glass-input text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* GDPR Consent */}
          {showConsent && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="otp-gdpr-consent"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                disabled={isSending}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-background/50 text-wine focus:ring-wine/50 focus:ring-offset-0"
              />
              <label htmlFor="otp-gdpr-consent" className="text-xs text-muted-foreground">
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

          {/* Error */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="w-full py-3 px-4 rounded-xl bg-wine text-white font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Invio in corso...</span>
              </>
            ) : (
              <span>Invia codice di verifica</span>
            )}
          </button>

          {/* Cancel */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSending}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    )
  }

  // ── Render: Code Step ─────────────────────────────

  return (
    <form onSubmit={handleVerify} className={className}>
      <div className="space-y-4">
        {/* Header with email */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Codice inviato a
          </p>
          <p className="text-sm font-medium">{email}</p>
          {expiryCountdown > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Il codice scade tra{' '}
              <span className={expiryCountdown <= 60 ? 'text-destructive font-medium' : ''}>
                {Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <p className="text-xs text-destructive mt-1 font-medium">
              Codice scaduto — rinvia un nuovo codice
            </p>
          )}
        </div>

        {/* 6-digit input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isVerifying}
              aria-label={`Cifra ${i + 1}`}
              className="w-9 h-12 text-center text-lg font-semibold glass-input text-foreground disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center justify-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify button */}
        <button
          type="submit"
          disabled={isVerifying || digits.join('').length !== OTP_LENGTH}
          className="w-full py-3 px-4 rounded-xl bg-wine text-white font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifica in corso...</span>
            </>
          ) : (
            <span>Verifica</span>
          )}
        </button>

        {/* Resend / change email */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isSending}
            className="text-sm text-wine hover:text-wine-light transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {countdown > 0
              ? `Rinvia codice tra ${countdown}s`
              : isSending
                ? 'Invio in corso...'
                : 'Rinvia codice'}
          </button>
          <button
            type="button"
            onClick={handleChangeEmail}
            disabled={isVerifying}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Cambia email
          </button>
        </div>
      </div>
    </form>
  )
}
