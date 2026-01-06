'use client'

import { useState } from 'react'
import { Wine as WineIcon, MapPin, Grape, Star, Pencil, Sparkles, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { WineWithRatings, WineType } from '@/types'

interface WineCardProps {
  wine: WineWithRatings
  onToggle: (available: boolean) => void
  onToggleRecommended: (recommended: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onRefresh: () => Promise<boolean>
}

const typeConfig: Record<WineType, { label: string; className: string }> = {
  red: { label: 'Rosso', className: 'bg-red-900/80 text-red-100' },
  white: { label: 'Bianco', className: 'bg-amber-700/80 text-amber-100' },
  rose: { label: 'Rosé', className: 'bg-pink-800/80 text-pink-100' },
  sparkling: { label: 'Spumante', className: 'bg-purple-800/80 text-purple-100' },
  dessert: { label: 'Dessert', className: 'bg-orange-800/80 text-orange-100' },
}

export function WineCard({ wine, onToggle, onToggleRecommended, onEdit, onDelete, onRefresh }: WineCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Optimistic UI state for toggles
  const [optimisticAvailable, setOptimisticAvailable] = useState(wine.available)
  const [optimisticRecommended, setOptimisticRecommended] = useState(wine.recommended)

  const typeInfo = typeConfig[wine.wine_type]
  const topRating = wine.ratings?.[0]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle availability toggle with optimistic update
  const handleToggleAvailable = (available: boolean) => {
    setOptimisticAvailable(available)
    onToggle(available)
  }

  // Handle recommended toggle with optimistic update
  const handleToggleRecommended = (recommended: boolean) => {
    setOptimisticRecommended(recommended)
    onToggleRecommended(recommended)
  }

  // Check if year is already in the name to avoid duplication
  const yearInName = wine.year && wine.name.includes(String(wine.year))
  const displayYear = wine.year && !yearInName

  return (
    <Card className={cn(
      'transition-all duration-200',
      'hover:shadow-lg hover:shadow-wine/10 hover:border-wine/30',
      !optimisticAvailable && 'opacity-60'
    )}>
      <CardContent className="p-5">
        {/* Header: Type Badge, Rating, Recommended Badge, Edit, Toggles */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Badge */}
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded',
                typeInfo.className
              )}
            >
              {typeInfo.label}
            </span>

            {/* Rating Badge */}
            {topRating && (
              <span className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                {topRating.score}
              </span>
            )}

            {/* Recommended Badge */}
            {optimisticRecommended && (
              <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded border border-amber-500/30">
                <Sparkles className="h-3 w-3" />
                Consigliato
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Modifica vino"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Elimina vino"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Refresh Enrichment Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isRefreshing
                  ? 'text-wine cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title="Aggiorna valutazioni"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>

            {/* Recommended Toggle */}
            <button
              onClick={() => handleToggleRecommended(!optimisticRecommended)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                optimisticRecommended
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={optimisticRecommended ? 'Rimuovi da consigliati' : 'Aggiungi ai consigliati'}
            >
              <Sparkles className="h-4 w-4" />
            </button>

            {/* Availability Toggle */}
            <Switch
              checked={optimisticAvailable}
              onCheckedChange={handleToggleAvailable}
              title={optimisticAvailable ? 'Disponibile' : 'Non disponibile'}
            />
          </div>
        </div>

        {/* Wine Name */}
        <h3 className="text-lg font-semibold mb-2">
          {wine.name}
          {displayYear && ` ${wine.year}`}
        </h3>

        {/* Producer & Region */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
          {wine.producer && (
            <span className="flex items-center gap-1">
              <WineIcon className="h-3.5 w-3.5" />
              {wine.producer}
            </span>
          )}
          {wine.region && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {wine.region}
            </span>
          )}
        </div>

        {/* Grape Varieties */}
        {wine.grape_varieties && wine.grape_varieties.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Grape className="h-3.5 w-3.5" />
            {wine.grape_varieties.join(', ')}
          </div>
        )}

        {/* Description */}
        {wine.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {wine.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline justify-between pt-3 border-t border-border">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-wine">
              {formatPrice(wine.price)}
            </span>
            <span className="text-sm text-muted-foreground">/bottiglia</span>
          </div>
          {wine.price_glass && (
            <span className="text-sm text-muted-foreground">
              {formatPrice(wine.price_glass)}/calice
            </span>
          )}
        </div>

        {/* Rating Source */}
        {topRating && (
          <p className="text-xs text-muted-foreground mt-2">
            Valutato da {topRating.guide_name}
          </p>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm font-medium text-destructive mb-3">
              Eliminare questo vino?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDelete()
                  setShowDeleteConfirm(false)
                }}
                className="px-3 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Elimina
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
