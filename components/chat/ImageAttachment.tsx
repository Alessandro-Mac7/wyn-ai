'use client'

import { useState, useRef, useEffect } from 'react'
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

export function ImageAttachment({
  onImageSelect,
  onImageClear,
  imagePreview,
  isLoading = false,
  disabled = false,
}: ImageAttachmentProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptions])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un\'immagine valida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Immagine troppo grande. Massimo 5MB.')
      return
    }

    // Convert to base64 data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      onImageSelect(dataUrl)
      setShowOptions(false)
    }
    reader.onerror = () => {
      alert('Errore nella lettura del file. Riprova.')
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }

  const handleButtonClick = () => {
    if (disabled || isLoading) return
    setShowOptions(!showOptions)
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
    setShowOptions(false)
  }

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
    setShowOptions(false)
  }

  const isDisabled = disabled || isLoading

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-2 left-0"
          >
            <div className="relative rounded-lg overflow-hidden border border-border bg-card shadow-lg">
              <img
                src={imagePreview}
                alt="Anteprima etichetta"
                className="w-20 h-20 object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
              {!isLoading && (
                <button
                  onClick={onImageClear}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Rimuovi immagine"
                >
                  <X className="h-3 w-3 text-white" />
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
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </motion.button>

      {/* Options popup */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
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
                  onClick={handleCameraClick}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors text-left"
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
              onClick={handleGalleryClick}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary transition-colors text-left"
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
