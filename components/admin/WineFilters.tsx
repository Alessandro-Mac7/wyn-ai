'use client'

import { cn } from '@/lib/utils'
import type { WineType } from '@/types'

type FilterValue = WineType | 'all'

interface WineFiltersProps {
  selected: FilterValue
  onChange: (value: FilterValue) => void
}

const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'red', label: 'Rossi' },
  { value: 'white', label: 'Bianchi' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Spumanti' },
  { value: 'dessert', label: 'Dessert' },
]

export function WineFilters({ selected, onChange }: WineFiltersProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            selected === filter.value
              ? 'bg-wine/20 text-wine border border-wine/30'
              : 'glass-badge glass-hover'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
