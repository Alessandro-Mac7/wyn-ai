'use client'

import { Trash2, Sparkles } from 'lucide-react'
import { WineTypeBadge } from '@/components/ui/wine-type-badge'
import { cn } from '@/lib/utils'
import type { WineScan } from '@/types'

interface ScanHistoryItemProps {
  scan: WineScan
  onSelect: (scan: WineScan) => void
  onDelete: (id: string) => void
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Adesso'
  if (diffMin < 60) return `${diffMin} min fa`
  if (diffH < 24) return `${diffH}h fa`
  if (diffD === 1) return 'Ieri'
  if (diffD < 7) return `${diffD}g fa`
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function ScanHistoryItem({ scan, onSelect, onDelete }: ScanHistoryItemProps) {
  const data = scan.extracted_data
  const isDeep = data.scan_type === 'deep'

  return (
    <button
      onClick={() => onSelect(scan)}
      className={cn(
        'w-full text-left p-3 rounded-xl glass-card',
        'border border-white/[0.06]',
        'hover:border-white/[0.12] transition-colors',
        'flex items-center gap-3'
      )}
    >
      {/* Wine info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {data.wine_type && <WineTypeBadge type={data.wine_type} />}
          {data.year && (
            <span className="text-[10px] text-muted-foreground">{data.year}</span>
          )}
          {isDeep && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-wine">
              <Sparkles className="h-2.5 w-2.5" />
              Analisi
            </span>
          )}
        </div>
        <p className="text-sm font-medium truncate">
          {data.name || 'Vino sconosciuto'}
        </p>
        {data.producer && (
          <p className="text-xs text-muted-foreground truncate">{data.producer}</p>
        )}
      </div>

      {/* Right side: date + delete */}
      <div className="shrink-0 flex flex-col items-end gap-2">
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeDate(scan.scanned_at)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(scan.id)
          }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
          aria-label="Elimina scansione"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </button>
  )
}
