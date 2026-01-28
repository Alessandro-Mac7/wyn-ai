'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ImagePlus, X, Loader2, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  onImageSelect: (imageDataUrl: string) => void
  disabled?: boolean
}

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const COMPRESSION_MAX_WIDTH = 1200
const COMPRESSION_QUALITY = 0.85

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > COMPRESSION_MAX_WIDTH) {
        height = Math.round((height * COMPRESSION_MAX_WIDTH) / width)
        width = COMPRESSION_MAX_WIDTH
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato non supportato. Usa JPEG, PNG, WebP o GIF.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Immagine troppo grande. Massimo 5MB.' }
  }
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (img.width < 100 || img.height < 100) {
        resolve({ valid: false, error: 'Immagine troppo piccola. Usa una foto più grande.' })
        return
      }
      resolve({ valid: true })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ valid: false, error: 'File non valido. Seleziona un\'immagine.' })
    }
    img.src = objectUrl
  })
}

export function ImageUploader({ onImageSelect, disabled = false }: ImageUploaderProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(isMobileDevice || (hasTouch && window.innerWidth < 768))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const validation = await validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'File non valido')
        return
      }
      const compressedDataUrl = await compressImage(file)
      onImageSelect(compressedDataUrl)
    } catch {
      setError('Errore nella lettura del file. Riprova.')
    } finally {
      setIsProcessing(false)
      e.target.value = ''
    }
  }, [onImageSelect])

  const isDisabled = disabled || isProcessing

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-wine/10">
        <Wine className="h-8 w-8 text-wine" />
      </div>

      <div className="text-center">
        <h3 className="text-sm font-semibold">Scansiona un&apos;etichetta</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Scatta una foto o carica un&apos;immagine per analizzare il vino
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-[240px]">
        {isMobile && (
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isDisabled}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl',
              'bg-wine text-white font-medium text-sm',
              'hover:bg-wine-dark transition-colors btn-press',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Scatta foto
          </button>
        )}

        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isDisabled}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl',
            'border border-border text-foreground font-medium text-sm',
            'hover:bg-secondary transition-colors btn-press',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            !isMobile && 'bg-wine text-white hover:bg-wine-dark border-transparent'
          )}
        >
          {isProcessing && !isMobile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {isMobile ? 'Scegli dalla galleria' : 'Carica immagine'}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-red-400"
          >
            <X className="h-3 w-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
