'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
  position?: 'center' | 'top' // center for chat, top for other pages
}

export function MobileSidebarToggle({ isOpen, onToggle, position = 'center' }: MobileSidebarToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        // Fixed on left edge (z-30 to stay below sidebar z-40 and panels z-[70])
        'fixed left-0 z-30',
        // Tab shape: rounded on right side only
        'p-2 rounded-r-xl',
        'bg-card/90 backdrop-blur-md border border-l-0 border-border',
        'shadow-lg hover:bg-secondary transition-colors duration-200',
        'sm:hidden', // Only show on mobile
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
      )}
      aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
      aria-expanded={isOpen}
      whileTap={{ scale: 0.95 }}
      animate={{
        left: isOpen ? 56 : 0, // 56px = sidebar width (w-14)
        top: position === 'center' ? '50%' : '1rem',
        y: position === 'center' ? '-50%' : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
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
