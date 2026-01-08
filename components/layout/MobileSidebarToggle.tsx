'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function MobileSidebarToggle({ isOpen, onToggle }: MobileSidebarToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        // Vertically centered on left edge
        'fixed left-0 top-1/2 -translate-y-1/2 z-50',
        // Tab shape: rounded on right side only
        'p-2 rounded-r-xl',
        'bg-card/90 backdrop-blur-md border border-l-0 border-border',
        'shadow-lg hover:bg-secondary transition-all duration-200',
        'sm:hidden', // Only show on mobile
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
      )}
      aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
      aria-expanded={isOpen}
      whileTap={{ scale: 0.95 }}
      animate={{
        left: isOpen ? 56 : 0, // 56px = sidebar width (w-14)
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <motion.div
        animate={{
          rotate: isOpen ? -15 : 15,
          scale: isOpen ? 0.9 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Image
          src="/wyn-icon.ico"
          alt="Menu"
          width={28}
          height={28}
          className="w-7 h-7"
        />
      </motion.div>
    </motion.button>
  )
}
