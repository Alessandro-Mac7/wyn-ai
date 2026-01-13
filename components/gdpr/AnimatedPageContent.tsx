'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedPageContentProps {
  children: ReactNode
  title: string
}

// Custom easing for smooth animations
const smoothEase = [0.25, 0.46, 0.45, 0.94] as const

// Staggered animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
}

const titleVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
}

export function AnimatedPageContent({ children, title }: AnimatedPageContentProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <motion.h1
          className="text-3xl font-bold text-foreground mb-8"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          {title}
        </motion.h1>

        <motion.div
          className="prose prose-invert max-w-none space-y-6 text-muted-foreground"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.div>
      </div>
    </main>
  )
}

// Animated section for individual content blocks
export function AnimatedSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.section variants={itemVariants} className={className}>
      {children}
    </motion.section>
  )
}

// Animated paragraph
export function AnimatedParagraph({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.p variants={itemVariants} className={className}>
      {children}
    </motion.p>
  )
}

// Animated table wrapper
export function AnimatedTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={`overflow-x-auto ${className}`}>
      {children}
    </motion.div>
  )
}
