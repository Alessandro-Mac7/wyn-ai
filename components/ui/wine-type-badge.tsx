import { cn } from '@/lib/utils'

interface WineTypeBadgeProps {
  type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'
  size?: 'sm' | 'md'
  className?: string
}

const typeConfig = {
  red: { label: 'Rosso', colorClass: 'bg-wine-type-red/20 text-wine-type-red border-wine-type-red/20' },
  white: { label: 'Bianco', colorClass: 'bg-wine-type-white/20 text-wine-type-white border-wine-type-white/20' },
  rose: { label: 'Rosé', colorClass: 'bg-wine-type-rose/20 text-wine-type-rose border-wine-type-rose/20' },
  sparkling: { label: 'Spumante', colorClass: 'bg-wine-type-sparkling/20 text-wine-type-sparkling border-wine-type-sparkling/20' },
  dessert: { label: 'Dessert', colorClass: 'bg-wine-type-dessert/20 text-wine-type-dessert border-wine-type-dessert/20' },
} as const

export function WineTypeBadge({ type, size = 'sm', className }: WineTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.red

  return (
    <span
      className={cn(
        'glass-badge inline-flex items-center font-medium rounded-full',
        config.colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {config.label}
    </span>
  )
}
