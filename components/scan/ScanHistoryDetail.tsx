'use client'

import { ArrowLeft, Trash2 } from 'lucide-react'
import { WineAnalysisCard } from './WineAnalysisCard'
import { WineTypeBadge } from '@/components/ui/wine-type-badge'
import { cn } from '@/lib/utils'
import type { WineScan } from '@/types'

interface ScanHistoryDetailProps {
  scan: WineScan
  onBack: () => void
  onDelete: (id: string) => void
}

export function ScanHistoryDetail({ scan, onBack, onDelete }: ScanHistoryDetailProps) {
  const data = scan.extracted_data
  const isDeep = data.scan_type === 'deep' && data.analysis

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="shrink-0 flex items-center gap-2 pb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg glass-hover"
          aria-label="Torna alla lista"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium truncate flex-1">
          {data.name || 'Vino sconosciuto'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {isDeep && data.analysis ? (
          <WineAnalysisCard analysis={data.analysis} imageUrl={data.image_url} />
        ) : (
          /* Quick scan: simplified card */
          <div className="space-y-3 p-4 rounded-xl glass-card border border-white/[0.06]">
            <div className="flex items-center gap-2 flex-wrap">
              {data.wine_type && <WineTypeBadge type={data.wine_type} size="md" />}
              {data.year && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                  {data.year}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold">{data.name || 'Vino sconosciuto'}</h3>

            {data.producer && (
              <p className="text-sm text-muted-foreground">{data.producer}</p>
            )}

            {data.region && (
              <p className="text-xs text-muted-foreground">{data.region}</p>
            )}

            {data.denomination && (
              <p className="text-xs text-muted-foreground">{data.denomination}</p>
            )}

            {data.grape_varieties && data.grape_varieties.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.grape_varieties.map((grape) => (
                  <span
                    key={grape}
                    className="text-xs px-2 py-0.5 rounded-full bg-wine/10 text-wine"
                  >
                    {grape}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Scansionato il{' '}
              {new Date(scan.scanned_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={() => onDelete(scan.id)}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3 rounded-xl',
            'border border-destructive/20 text-sm font-medium text-destructive',
            'hover:bg-destructive/10 transition-colors btn-press'
          )}
        >
          <Trash2 className="h-4 w-4" />
          Elimina scansione
        </button>
      </div>
    </div>
  )
}
