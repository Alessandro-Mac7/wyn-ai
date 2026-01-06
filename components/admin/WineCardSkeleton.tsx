'use client'

import { Card, CardContent } from '@/components/ui/card'

export function WineCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5">
        {/* Header: Badge placeholders */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-muted rounded-md" />
            <div className="h-7 w-7 bg-muted rounded-md" />
            <div className="h-6 w-11 bg-muted rounded-full" />
          </div>
        </div>

        {/* Wine Name */}
        <div className="h-7 w-3/4 bg-muted rounded mb-2" />

        {/* Producer & Region */}
        <div className="flex gap-4 mb-2">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
        </div>

        {/* Grape Varieties */}
        <div className="h-5 w-32 bg-muted rounded mb-3" />

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between pt-3 border-t border-border">
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-4 w-14 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
