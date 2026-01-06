// lib/motion.ts
// Framer Motion animation variants for WYN chat UI

import { Variants, Transition } from 'framer-motion'

// Standard transitions
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const easeOutTransition: Transition = {
  duration: 0.2,
  ease: [0, 0, 0.2, 1],
}

export const easeInTransition: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 1, 1],
}

// Message animations
export const messageVariants: Variants = {
  hidden: (isUser: boolean) => ({
    opacity: 0,
    x: isUser ? 12 : -12,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: easeOutTransition,
  },
}

// Typing indicator
export const typingContainerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
}

export const typingDotVariants: Variants = {
  bounce: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.1,
      ease: 'easeInOut',
    },
  }),
}

// Quick suggestion pills
export const suggestionContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const suggestionItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeOutTransition,
  },
}

// Mode toggle sliding pill
export const togglePillVariants: Variants = {
  chat: { x: 0 },
  venue: { x: '100%' },
}

// Input states
export const inputVariants: Variants = {
  idle: {
    boxShadow: '0 0 0 0 rgba(139, 41, 66, 0)',
  },
  focused: {
    boxShadow: '0 0 0 2px rgba(139, 41, 66, 0.5)',
    transition: { duration: 0.15 },
  },
  error: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.3 },
  },
}

// Modal/overlay animations
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
}

// Card interactions
export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
}

// List stagger
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeOutTransition,
  },
}
