'use client'

import { useEffect, RefObject } from 'react'

/**
 * Hook to trap keyboard focus within a container (for modals, dialogs, etc.)
 * Handles Tab navigation and Escape key to close
 */
export function useKeyboardTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement>,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const container = containerRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Trap Tab navigation within container
      if (e.key === 'Tab') {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift+Tab: go backwards
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: go forward
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Focus first element when opened
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => focusableElements[0]?.focus(), 10)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, containerRef, onClose])
}
