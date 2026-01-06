'use client'

import { motion } from 'framer-motion'
import { MessageCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModeToggleProps {
  mode: 'chat' | 'venue'
  onChange: (mode: 'chat' | 'venue') => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="relative inline-flex items-center gap-1 p-1 bg-secondary rounded-lg">
      {/* Sliding background pill */}
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-background rounded-md shadow-sm"
        initial={false}
        animate={{
          x: mode === 'chat' ? 0 : '100%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />

      <button
        onClick={() => onChange('chat')}
        className={cn(
          'relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors min-h-[44px]',
          'btn-press',
          mode === 'chat'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={mode === 'chat'}
      >
        <motion.div
          animate={{ rotate: mode === 'chat' ? 0 : -10 }}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle className="h-4 w-4" />
        </motion.div>
        Chat
      </button>

      <button
        onClick={() => onChange('venue')}
        className={cn(
          'relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors min-h-[44px]',
          'btn-press',
          mode === 'venue'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={mode === 'venue'}
      >
        <motion.div
          animate={{ rotate: mode === 'venue' ? 0 : 10 }}
          transition={{ duration: 0.2 }}
        >
          <MapPin className="h-4 w-4" />
        </motion.div>
        Venue
      </button>
    </div>
  )
}
