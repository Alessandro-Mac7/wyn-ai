'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Cookie, X, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Consent preferences stored in localStorage
export interface ConsentPreferences {
  necessary: boolean // Always true - essential cookies
  analytics: boolean // Usage analytics
  timestamp: number
}

const CONSENT_KEY = 'wyn-cookie-consent'
const CONSENT_VERSION = 1

// Get consent from localStorage
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    // Check if consent is valid and not too old (1 year)
    if (parsed.timestamp && Date.now() - parsed.timestamp < 365 * 24 * 60 * 60 * 1000) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

// Save consent to localStorage
function saveConsent(preferences: ConsentPreferences) {
  if (typeof window === 'undefined') return

  localStorage.setItem(CONSENT_KEY, JSON.stringify({
    ...preferences,
    version: CONSENT_VERSION,
  }))
}

interface ConsentBannerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void
}

export function ConsentBanner({ onConsentChange }: ConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)

  // Check for existing consent on mount
  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      // Small delay for smoother initial load
      const timer = setTimeout(() => setShowBanner(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    const preferences: ConsentPreferences = {
      necessary: true,
      analytics: true,
      timestamp: Date.now(),
    }
    saveConsent(preferences)
    onConsentChange?.(preferences)
    setShowBanner(false)
  }

  const handleRejectNonEssential = () => {
    const preferences: ConsentPreferences = {
      necessary: true,
      analytics: false,
      timestamp: Date.now(),
    }
    saveConsent(preferences)
    onConsentChange?.(preferences)
    setShowBanner(false)
  }

  const handleSaveSettings = () => {
    const preferences: ConsentPreferences = {
      necessary: true,
      analytics: analyticsEnabled,
      timestamp: Date.now(),
    }
    saveConsent(preferences)
    onConsentChange?.(preferences)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom"
      >
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Main banner content */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-wine/10 rounded-lg shrink-0">
                <Cookie className="h-5 w-5 text-wine" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Utilizziamo i cookie
                </h3>
                <p className="text-sm text-muted-foreground">
                  Utilizziamo cookie tecnici essenziali per il funzionamento del sito
                  e cookie analitici per migliorare la tua esperienza.{' '}
                  <Link
                    href="/cookie-policy"
                    className="text-wine hover:underline"
                  >
                    Scopri di più
                  </Link>
                </p>
              </div>
            </div>

            {/* Settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {/* Essential cookies - always on */}
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground text-sm">Cookie tecnici</p>
                        <p className="text-xs text-muted-foreground">Necessari per il funzionamento del sito</p>
                      </div>
                      <div className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded border border-green-700">
                        Sempre attivi
                      </div>
                    </div>

                    {/* Analytics cookies - toggleable */}
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground text-sm">Cookie analitici</p>
                        <p className="text-xs text-muted-foreground">Per migliorare l&apos;esperienza utente</p>
                      </div>
                      <button
                        onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          analyticsEnabled ? 'bg-wine' : 'bg-secondary border border-border'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                            analyticsEnabled ? 'left-6' : 'left-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {showSettings ? (
                <>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                    className="flex-1 text-muted-foreground"
                  >
                    Indietro
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    className="flex-1 bg-wine hover:bg-wine-dark text-white"
                  >
                    Salva preferenze
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleRejectNonEssential}
                    variant="ghost"
                    className="flex-1 text-muted-foreground order-2 sm:order-1"
                  >
                    Solo necessari
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="flex-1 order-3 sm:order-2"
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Personalizza
                  </Button>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-wine hover:bg-wine-dark text-white order-1 sm:order-3"
                  >
                    Accetta tutti
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Legal links */}
          <div className="px-4 sm:px-6 py-3 bg-secondary/50 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookie-policy" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Termini di Servizio
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
