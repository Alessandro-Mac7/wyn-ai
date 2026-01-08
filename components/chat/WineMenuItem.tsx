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
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  white: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  rose: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  sparkling: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  dessert: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
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
