'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  message?: string
  submessage?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

export function LoadingSpinner({
  message = 'Caricamento...',
  submessage,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        <Image
          src="/wyn-icon.ico"
          alt="WYN"
          width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className={cn(sizeClasses[size], 'animate-toast')}
          priority
        />
      </div>
      {message && (
        <div className="text-center">
          <p className="text-muted-foreground">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground/70 mt-1">{submessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
