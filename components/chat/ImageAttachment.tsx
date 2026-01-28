'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Camera, ImagePlus, X, Loader2, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageAttachmentProps {
  onImageSelect: (imageDataUrl: string) => void
  onImageClear: () => void
  imagePreview: string | null
  isLoading?: boolean
  disabled?: boolean
}

// Valid image MIME types
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Compression settings
const COMPRESSION_MAX_WIDTH = 1200
const COMPRESSION_QUALITY = 0.85

/**
 * Compress an image using Canvas API
 * Reduces file size significantly while maintaining quality
 */
async function compressImage(
  file: File,
  maxWidth: number = COMPRESSION_MAX_WIDTH,
  quality: number = COMPRESSION_QUALITY
): Promise<string> {
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

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG with compression
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

/**
 * Validate image file by checking actual content and dimensions
 */
async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check MIME type
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato non supportato. Usa JPEG, PNG, WebP o GIF.' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Immagine troppo grande. Massimo 5MB.' }
  }

  // Validate actual image content and dimensions
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Check minimum dimensions (100x100)
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

export function ImageAttachment({
  onImageSelect,
  onImageClear,
  imagePreview,
  isLoading = false,
  disabled = false,
}: ImageAttachmentProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      // Also check for touch capability and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(isMobileDevice || (hasTouch && window.innerWidth < 768))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setShowOptions(false)
      }
    }
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptions])

  // Keyboard navigation - Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOptions) {
        e.preventDefault()
        setShowOptions(false)
      }
    }
    if (showOptions) {
      window.addEventListener('keydown', handleKeyDown)
      // Focus first menu item when popup opens
      setTimeout(() => firstMenuItemRef.current?.focus(), 50)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showOptions])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      // Validate file
      const validation = await validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      // Compress image before sending
      const compressedDataUrl = await compressImage(file)
      onImageSelect(compressedDataUrl)
      setShowOptions(false)
    } catch (err) {
      console.error('Error processing image:', err)
      alert('Errore nella lettura del file. Riprova.')
    } finally {
      setIsProcessing(false)
      // Reset input
      e.target.value = ''
    }
  }, [onImageSelect])

  const handleButtonClick = useCallback(() => {
    if (disabled || isLoading || isProcessing) return
    setShowOptions(prev => !prev)
  }, [disabled, isLoading, isProcessing])

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click()
    setShowOptions(false)
  }, [])

  const handleGalleryClick = useCallback(() => {
    galleryInputRef.current?.click()
    setShowOptions(false)
  }, [])

  const isDisabled = disabled || isLoading || isProcessing

  return (
    <div className="relative" ref={containerRef}>
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

      {/* Screen reader announcement for popup state */}
      <div className="sr-only" role="status" aria-live="polite">
        {showOptions ? 'Menu opzioni immagine aperto' : ''}
      </div>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="absolute bottom-full mb-2 left-0 max-h-[40vh]"
          >
            <div className="relative rounded-lg overflow-hidden border border-border bg-card shadow-lg">
              <img
                src={imagePreview}
                alt="Anteprima etichetta"
                className="w-20 h-20 object-cover"
              />
              {(isLoading || isProcessing) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
              {!isLoading && !isProcessing && (
                <button
                  onClick={onImageClear}
                  className="absolute top-0.5 right-0.5 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Rimuovi immagine"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main "+" button */}
      <motion.button
        onClick={handleButtonClick}
        disabled={isDisabled}
        aria-label="Allega immagine etichetta"
        aria-expanded={showOptions}
        aria-haspopup="menu"
        className={cn(
          'shrink-0 p-3 rounded-lg',
          'transition-all duration-150',
          'btn-press',
          isDisabled
            ? 'text-muted-foreground cursor-not-allowed opacity-50'
            : showOptions
              ? 'bg-wine/20 text-wine'
              : imagePreview
                ? 'bg-wine/20 text-wine hover:bg-wine/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
        whileTap={!isDisabled ? { scale: 0.95 } : undefined}
        animate={showOptions ? { rotate: 45 } : { rotate: 0 }}
        transition={{ duration: 0.2 }}
      >
        {(isLoading || isProcessing) ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </motion.button>

      {/* Options popup */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label="Opzioni immagine"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[200px] z-50"
          >
            {/* Header */}
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wine className="h-3.5 w-3.5" />
                <span>Scansiona etichetta vino</span>
              </div>
            </div>

            {/* Camera option - only on mobile */}
            {isMobile && (
              <>
                <button
                  ref={firstMenuItemRef}
                  role="menuitem"
                  onClick={handleCameraClick}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors text-left focus:bg-secondary focus:outline-none"
                >
                  <div className="p-2 bg-wine/10 rounded-lg">
                    <Camera className="h-4 w-4 text-wine" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Scatta foto</p>
                    <p className="text-xs text-muted-foreground">Usa la fotocamera</p>
                  </div>
                </button>
                <div className="border-t border-border" />
              </>
            )}

            {/* Upload option - always visible */}
            <button
              ref={isMobile ? undefined : firstMenuItemRef}
              role="menuitem"
              onClick={handleGalleryClick}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors text-left focus:bg-secondary focus:outline-none"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ImagePlus className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isMobile ? 'Scegli dalla galleria' : 'Carica immagine'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMobile ? 'Seleziona una foto esistente' : 'Seleziona dal computer'}
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
