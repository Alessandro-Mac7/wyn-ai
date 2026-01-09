// components/pwa/InstallPrompt.tsx
// Smart install prompt that appears for engaged users

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { initInstallPrompt, showInstallPrompt, isAppInstalled } from '@/lib/pwa'

interface InstallPromptProps {
  messageCount: number // Number of user chat messages sent
}

export function InstallPrompt({ messageCount }: InstallPromptProps) {
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [timeOnSite, setTimeOnSite] = useState(0)

  // Track time on site (in seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnSite((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for install prompt event
  useEffect(() => {
    // Don't show if already installed
    if (isAppInstalled()) return

    const cleanup = initInstallPrompt(() => {
      setCanInstall(true)
    })

    return cleanup
  }, [])

  // Show conditions: ALL must be true
  // 1. Browser fired beforeinstallprompt (canInstall)
  // 2. User has not dismissed in this session
  // 3. User has sent at least 2 messages
  // 4. User has been on site for at least 60 seconds
  const shouldShow =
    canInstall &&
    !dismissed &&
    messageCount >= 2 &&
    timeOnSite >= 60

  const handleInstall = async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      setCanInstall(false)
    }
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={cn(
            'fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80',
            'p-4 rounded-xl',
            'bg-card border border-border',
            'shadow-lg z-50'
          )}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-wine/10 flex items-center justify-center">
              <Image
                src="/wyn-icon.png"
                alt="WYN"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">Aggiungi WYN alla Home</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accesso rapido al tuo sommelier AI
              </p>
            </div>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            className={cn(
              'w-full mt-3 py-2.5 px-4 rounded-lg',
              'flex items-center justify-center gap-2',
              'bg-wine text-white text-sm font-medium',
              'hover:bg-wine-dark transition-colors'
            )}
          >
            <Download className="h-4 w-4" />
            Installa App
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
