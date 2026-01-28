'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw, Wine } from 'lucide-react'
import { ImageUploader } from './ImageUploader'
import { WineAnalysisCard } from './WineAnalysisCard'
import { cn } from '@/lib/utils'
import type { WineAnalysis } from '@/types'

type ScannerState = 'idle' | 'analyzing' | 'results' | 'error'

export function LabelScanner() {
  const [state, setState] = useState<ScannerState>('idle')
  const [analysis, setAnalysis] = useState<WineAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleImageSelect = useCallback(async (imageDataUrl: string) => {
    // Cancel previous
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setState('analyzing')
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/analyze-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore nell\'analisi')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Analisi non riuscita')
      }

      setAnalysis(data.analysis)
      setState('results')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Errore nell\'analisi del vino')
      setState('error')
    } finally {
      abortRef.current = null
    }
  }, [])

  const handleReset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setState('idle')
    setAnalysis(null)
    setError(null)
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {state === 'idle' && (
        <div className="flex items-center justify-center min-h-[300px]">
          <ImageUploader onImageSelect={handleImageSelect} />
        </div>
      )}

      {state === 'analyzing' && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Wine className="h-10 w-10 text-wine" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm font-medium">Analisi in corso...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Scansione etichetta e valutazione del vino
            </p>
          </div>
          <Loader2 className="h-5 w-5 text-wine animate-spin" />
        </div>
      )}

      {state === 'results' && analysis && (
        <div className="space-y-4">
          <WineAnalysisCard analysis={analysis} />
          <button
            onClick={handleReset}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3 rounded-xl',
              'border border-border text-sm font-medium',
              'hover:bg-secondary transition-colors btn-press'
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Nuova scansione
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
            <Wine className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Prova con un&apos;altra immagine o riprova
            </p>
          </div>
          <button
            onClick={handleReset}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl',
              'bg-wine text-white text-sm font-medium',
              'hover:bg-wine-dark transition-colors btn-press'
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Riprova
          </button>
        </div>
      )}
    </div>
  )
}
