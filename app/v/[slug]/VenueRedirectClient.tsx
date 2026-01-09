'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { isFirstVisit, markAsVisited } from '@/lib/venue-flow'
import { haptic } from '@/lib/haptics'

interface VenueRedirectClientProps {
  slug: string
}

export function VenueRedirectClient({ slug }: VenueRedirectClientProps) {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const firstVisit = isFirstVisit()

    if (!firstVisit) {
      // Returning user: instant redirect
      router.replace(`/chat?venue=${encodeURIComponent(slug)}&from=qr`)
      return
    }

    // First-time user: show brief splash
    setShowSplash(true)
    markAsVisited()

    // Progress bar animation
    const duration = 1500 // 1.5 seconds
    const interval = 50
    const steps = duration / interval
    let step = 0

    const timer = setInterval(() => {
      step++
      setProgress((step / steps) * 100)

      if (step >= steps) {
        clearInterval(timer)
        router.replace(`/chat?venue=${encodeURIComponent(slug)}&from=qr`)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [slug, router])

  const handleSkip = () => {
    haptic.light()
    router.replace(`/chat?venue=${encodeURIComponent(slug)}&from=qr`)
  }

  if (!showSplash) {
    // Show minimal loading while deciding
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Image
          src="/wyn-icon.ico"
          alt="WYN"
          width={48}
          height={48}
          className="w-12 h-12 animate-pulse"
          priority
        />
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Image
          src="/wyn-icon.ico"
          alt="WYN"
          width={64}
          height={64}
          className="w-16 h-16"
          priority
        />
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center mt-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground">Benvenuto da</p>
        <h1 className="text-2xl font-bold mt-1 capitalize">
          {slug.replace(/-/g, ' ')}
        </h1>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="w-48 h-1 bg-secondary rounded-full mt-8 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="h-full bg-wine rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </motion.div>

      {/* Skip button */}
      <motion.button
        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Tocca per continuare
      </motion.button>
    </motion.div>
  )
}
