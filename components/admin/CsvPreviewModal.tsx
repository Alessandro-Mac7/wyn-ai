'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, Upload, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CsvParseResult, ParsedCsvWine, BulkImportResponse } from '@/types'
import { cn } from '@/lib/utils'

interface CsvPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  parseResult: CsvParseResult
  onImportComplete: (result: BulkImportResponse) => void
}

type ImportState = 'preview' | 'importing' | 'success' | 'error'

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Rosso',
  white: 'Bianco',
  rose: 'Rosé',
  sparkling: 'Spumante',
  dessert: 'Dolce',
}

export function CsvPreviewModal({
  isOpen,
  onClose,
  parseResult,
  onImportComplete,
}: CsvPreviewModalProps) {
  const [importState, setImportState] = useState<ImportState>('preview')
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validWines = useMemo(
    () => parseResult.wines.filter((w) => w.isValid),
    [parseResult.wines]
  )

  const handleImport = async () => {
    if (validWines.length === 0) return

    setImportState('importing')
    setError(null)

    try {
      const response = await fetch('/api/admin/wines/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wines: validWines.map((w) => w.data),
        }),
      })

      const result: BulkImportResponse = await response.json()

      if (!response.ok) {
        throw new Error((result as unknown as { error: string }).error || 'Errore durante l\'importazione')
      }

      setImportResult(result)
      setImportState('success')
      onImportComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      setImportState('error')
    }
  }

  const handleClose = () => {
    setImportState('preview')
    setImportResult(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-4xl mx-4 bg-card rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-wine/20 flex items-center justify-center">
                <Upload className="h-5 w-5 text-wine" />
              </div>
              <div>
                <h2 className="font-semibold">Anteprima Importazione</h2>
                <p className="text-sm text-muted-foreground">
                  Controlla i dati prima di importare
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                <span className="text-sm text-muted-foreground">Totale righe:</span>
                <span className="font-semibold">{parseResult.totalRows}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Validi: {parseResult.validCount}</span>
              </div>
              {parseResult.errorCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">Errori: {parseResult.errorCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {importState === 'preview' && (
              <WinePreviewTable wines={parseResult.wines} />
            )}

            {importState === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-wine border-t-transparent animate-spin mb-4" />
                <p className="text-lg font-medium">Importazione in corso...</p>
                <p className="text-sm text-muted-foreground">
                  Sto importando {validWines.length} vini
                </p>
              </div>
            )}

            {importState === 'success' && importResult && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-green-600">Importazione completata!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {importResult.imported} vini importati con successo
                </p>
                {importResult.failed > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {importResult.failed} vini non importati
                  </p>
                )}
              </div>
            )}

            {importState === 'error' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                  <FileWarning className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-medium text-destructive">Errore durante l&apos;importazione</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex justify-end gap-3">
              {importState === 'preview' && (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Annulla
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validWines.length === 0}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importa {validWines.length} vini
                  </Button>
                </>
              )}
              {(importState === 'success' || importState === 'error') && (
                <Button onClick={handleClose}>Chiudi</Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function WinePreviewTable({ wines }: { wines: ParsedCsvWine[] }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[50px_1fr_100px_80px_80px_1fr] gap-2 p-3 bg-secondary text-sm font-medium">
        <div>#</div>
        <div>Nome</div>
        <div>Tipo</div>
        <div>Anno</div>
        <div>Prezzo</div>
        <div>Stato</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border max-h-[400px] overflow-auto">
        {wines.map((wine) => (
          <div
            key={wine.rowNumber}
            className={cn(
              'grid grid-cols-[50px_1fr_100px_80px_80px_1fr] gap-2 p-3 text-sm',
              !wine.isValid && 'bg-destructive/5'
            )}
          >
            <div className="text-muted-foreground">{wine.rowNumber}</div>
            <div className="font-medium truncate">{wine.data.name || '-'}</div>
            <div>{WINE_TYPE_LABELS[wine.data.wine_type] || wine.data.wine_type}</div>
            <div>{wine.data.year || '-'}</div>
            <div>€{wine.data.price.toFixed(2)}</div>
            <div>
              {wine.isValid ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Valido
                </span>
              ) : (
                <div className="flex flex-col gap-1">
                  {wine.errors.map((error, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-destructive text-xs"
                    >
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      {error.field}: {error.message}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
