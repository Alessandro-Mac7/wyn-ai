'use client'

import { useRef, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface ScanButtonProps {
  onScan: (imageDataUrl: string) => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function ScanButton({
  onScan,
  disabled = false,
  isLoading = false,
  className
}: ScanButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('File selected is not an image')
      return
    }

    // Convert to base64 data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      onScan(dataUrl)
    }
    reader.onerror = () => {
      console.error('Error reading file')
    }
    reader.readAsDataURL(file)

    // Reset input to allow selecting the same file again
    e.target.value = ''
  }

  const isDisabled = disabled || isLoading

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <Tooltip content="Scansiona etichetta" side="top">
        <motion.button
          onClick={handleClick}
          disabled={isDisabled}
          aria-label="Scansiona etichetta vino"
          className={cn(
            'shrink-0 p-3 rounded-lg',
            'transition-all duration-150',
            'btn-press',
            isDisabled
              ? 'text-muted-foreground cursor-not-allowed opacity-50'
              : 'bg-wine text-white hover:bg-wine-dark active:scale-95',
            className
          )}
          whileTap={!isDisabled ? { scale: 0.95 } : undefined}
          whileHover={!isDisabled ? { scale: 1.05 } : undefined}
          transition={{ duration: 0.15 }}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </motion.button>
      </Tooltip>
    </>
  )
}
