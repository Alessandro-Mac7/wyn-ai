'use client'

import { motion } from 'framer-motion'
import {
  suggestionContainerVariants,
  suggestionItemVariants,
} from '@/lib/motion'

interface QuickSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  disabled?: boolean
}

export function QuickSuggestions({
  suggestions,
  onSelect,
  disabled = false,
}: QuickSuggestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <p className="text-muted-foreground mb-6 text-center">
        Cosa vorresti sapere?
      </p>
      <motion.div
        className="flex flex-wrap gap-2 justify-center max-w-lg"
        variants={suggestionContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            custom={i}
            variants={suggestionItemVariants}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="px-4 py-2.5 text-sm border border-border rounded-full
                       hover:border-wine/50 hover:bg-secondary/50
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       min-h-[44px]"
          >
            {suggestion}
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
