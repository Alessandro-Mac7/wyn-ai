'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function Tooltip({ content, children, side = 'right', className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  // Hide tooltip on window resize (device view switch) and touch devices
  React.useEffect(() => {
    const handleResize = () => setIsVisible(false)
    const handleScroll = () => setIsVisible(false)

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  // Check if device supports hover (not touch-only)
  const isTouchDevice = typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-popover border-x-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-popover border-y-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-popover border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-popover border-y-transparent border-r-transparent',
  }

  // Don't show tooltips on touch devices
  const showTooltip = isVisible && !isTouchDevice

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {showTooltip && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium',
            'bg-popover text-popover-foreground rounded-md shadow-md',
            'whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-100',
            positionClasses[side],
            className
          )}
        >
          {content}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </div>
  )
}
