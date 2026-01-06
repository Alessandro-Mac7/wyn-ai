'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
