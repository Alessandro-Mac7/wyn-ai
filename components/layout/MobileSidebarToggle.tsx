'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { usePanelContext } from '@/contexts/panel-context'

interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
  position?: 'center' | 'top'
}

export function MobileSidebarToggle({ isOpen, onToggle, position = 'center' }: MobileSidebarToggleProps) {
  const { isPanelOpen } = usePanelContext()

  // Hide toggle when any slide-in panel is open
  if (isPanelOpen) {
    return null
  }

  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        'fixed left-0 z-30',
        'p-2 rounded-r-xl',
        'bg-card/90 backdrop-blur-md border border-l-0 border-border',
        'shadow-lg hover:bg-secondary transition-colors duration-200',
        'sm:hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
      )}
      aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
      aria-expanded={isOpen}
      whileTap={{ scale: 0.95 }}
      animate={{
        left: isOpen ? 56 : 0,
        top: position === 'center' ? '50%' : 'calc(env(safe-area-inset-top, 0px) + 1rem)',
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
          scale: isOpen ? 0.9 : 1,
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
