'use client'

import { Wine, Star } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import type { WineWithRatings, WineType } from '@/types'

interface WineMenuItemProps {
  wine: WineWithRatings
}

const wineTypeLabels: Record<WineType, string> = {
  red: 'Rosso',
  white: 'Bianco',
  rose: 'Rosé',
  sparkling: 'Spumante',
  dessert: 'Dessert',
}

const wineTypeColors: Record<WineType, string> = {
  red: 'bg-wine-type-red/20 text-wine-type-red border-wine-type-red/30',
  white: 'bg-wine-type-white/20 text-wine-type-white border-wine-type-white/30',
  rose: 'bg-wine-type-rose/20 text-wine-type-rose border-wine-type-rose/30',
  sparkling: 'bg-wine-type-sparkling/20 text-wine-type-sparkling border-wine-type-sparkling/30',
  dessert: 'bg-wine-type-dessert/20 text-wine-type-dessert border-wine-type-dessert/30',
}

export function WineMenuItem({ wine }: WineMenuItemProps) {
  // Get the best rating if available
  const bestRating = wine.ratings?.length > 0
    ? wine.ratings.reduce((best, r) => r.confidence > best.confidence ? r : best, wine.ratings[0])
    : null

  return (
    <div className="p-4 bg-secondary/50 rounded-xl border border-border/50 hover:border-wine/30 transition-colors">
      {/* Header: Type badge + Recommended + Rating */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
          wineTypeColors[wine.wine_type]
        )}>
          <Wine className="h-3 w-3" />
          {wineTypeLabels[wine.wine_type]}
        </span>

        {wine.recommended && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-wine/20 text-wine border border-wine/30">
            Consigliato
          </span>
        )}

        {bestRating && (
          <span className="ml-auto flex items-center gap-1 text-xs text-status-warning">
            <Star className="h-3 w-3 fill-current" />
            {bestRating.score}
          </span>
        )}
      </div>

      {/* Wine name and year */}
      <h3 className="font-semibold text-foreground">
        {wine.name}
        {wine.year && <span className="text-muted-foreground font-normal ml-1">{wine.year}</span>}
      </h3>

      {/* Producer and region */}
      <p className="text-sm text-muted-foreground mt-1">
        {wine.producer}
        {wine.producer && wine.region && ' • '}
        {wine.region}
      </p>

      {/* Description (truncated) */}
      {wine.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {wine.description}
        </p>
      )}

      {/* Price */}
      <div className="flex items-center gap-3 mt-3 text-sm">
        <span className="font-semibold text-wine">
          {formatPrice(wine.price)}
        </span>
        {wine.price_glass && (
          <span className="text-muted-foreground">
            {formatPrice(wine.price_glass)} /calice
          </span>
        )}
      </div>
    </div>
  )
}
