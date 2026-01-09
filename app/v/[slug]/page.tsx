'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Wine, MapPin, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VenuePageProps {
  params: Promise<{
    slug: string
  }>
}

interface VenueData {
  name: string
  description?: string
  city?: string
  address?: string
}

export default function VenuePage({ params }: VenuePageProps) {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [venue, setVenue] = useState<VenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  // Fetch venue data
  useEffect(() => {
    if (!slug) return

    async function fetchVenue() {
      try {
        const response = await fetch(`/api/venue/${encodeURIComponent(slug!)}`)
        if (response.ok) {
          const data = await response.json()
          setVenue(data.venue)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchVenue()
  }, [slug])

  const handleStartChat = () => {
    if (!slug) return
    setIsNavigating(true)
    router.push(`/chat?venue=${encodeURIComponent(slug)}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-wine" />
      </div>
    )
  }

  // Error state
  if (error || !venue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Wine className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Locale non trovato</h1>
        <p className="text-muted-foreground mb-6">
          Il codice del locale non è valido o non esiste più.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-wine text-white rounded-xl font-medium hover:bg-wine-dark transition-colors"
        >
          Torna alla Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Image
            src="/wyn-logo.png"
            alt="WYN"
            width={200}
            height={80}
            className="h-20 w-auto"
            priority
          />
        </motion.div>

        {/* Venue Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wine/20 text-wine border border-wine/30 mb-4"
        >
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Sei al locale</span>
        </motion.div>

        {/* Venue Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-3xl sm:text-4xl font-bold mb-2"
        >
          {venue.name}
        </motion.h1>

        {/* Venue Location */}
        {(venue.city || venue.address) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-muted-foreground mb-6"
          >
            {venue.address && <span>{venue.address}</span>}
            {venue.address && venue.city && <span> · </span>}
            {venue.city && <span>{venue.city}</span>}
          </motion.p>
        )}

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="text-lg text-muted-foreground max-w-md mb-8"
        >
          Scopri i vini di questo locale con l'aiuto del tuo sommelier AI personale.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={handleStartChat}
          disabled={isNavigating}
          className={cn(
            'flex items-center gap-3 px-8 py-4',
            'text-lg font-semibold rounded-2xl',
            'bg-wine text-white',
            'shadow-[0_4px_20px_rgba(143,36,54,0.4)]',
            'hover:bg-wine-dark hover:shadow-[0_4px_24px_rgba(143,36,54,0.5)]',
            'transition-all duration-200',
            'disabled:opacity-70'
          )}
        >
          {isNavigating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Wine className="h-5 w-5" />
              Inizia a Esplorare i Vini
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </motion.button>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="text-sm text-muted-foreground mt-4"
        >
          Chatta con l'AI per trovare il vino perfetto
        </motion.p>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="p-6 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Powered by WYN · Il tuo sommelier AI
        </p>
      </motion.footer>
    </div>
  )
}
