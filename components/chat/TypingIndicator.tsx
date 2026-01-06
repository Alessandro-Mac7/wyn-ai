'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  typingContainerVariants,
  typingDotVariants,
} from '@/lib/motion'

interface TypingIndicatorProps {
  visible: boolean
}

export function TypingIndicator({ visible }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="flex justify-start"
          variants={typingContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="bg-secondary rounded-2xl px-4 py-3">
            <div className="flex gap-1.5" role="status" aria-label="Digitando...">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={typingDotVariants}
                  animate="bounce"
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                />
              ))}
              <span className="sr-only">Il sommelier sta scrivendo...</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
