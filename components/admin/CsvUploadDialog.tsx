'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseCsvFile, downloadSampleCsv } from '@/lib/csv-parser'
import type { CsvParseResult } from '@/types'
import { cn } from '@/lib/utils'

interface CsvUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onParsed: (result: CsvParseResult) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function CsvUploadDialog({ isOpen, onClose, onParsed }: CsvUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Seleziona un file CSV')
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('Il file supera il limite di 5MB')
        return
      }

      setIsProcessing(true)

      try {
        const result = await parseCsvFile(file)
        onParsed(result)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore durante l\'elaborazione')
      } finally {
        setIsProcessing(false)
      }
    },
    [onParsed, onClose]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [processFile]
  )

  const handleDownloadSample = useCallback(() => {
    downloadSampleCsv()
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg mx-4 bg-card rounded-xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-wine/20 flex items-center justify-center">
                <Upload className="h-5 w-5 text-wine" />
              </div>
              <div>
                <h2 className="font-semibold">Importa Vini da CSV</h2>
                <p className="text-sm text-muted-foreground">
                  Carica un file CSV con i tuoi vini
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-wine bg-wine/10'
                  : 'border-border hover:border-wine/50 hover:bg-secondary/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-wine border-t-transparent animate-spin" />
                  <p className="text-muted-foreground">Elaborazione in corso...</p>
                </div>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">
                    {isDragging ? 'Rilascia il file qui' : 'Trascina un file CSV'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    oppure clicca per selezionare
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Massimo 5MB
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Sample Download */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Hai bisogno di un modello?</p>
                  <p className="text-xs text-muted-foreground">
                    Scarica il file CSV di esempio
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Scarica Template
                </Button>
              </div>
            </div>

            {/* Required Columns Info */}
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs font-medium mb-2">Colonne obbligatorie:</p>
              <div className="flex flex-wrap gap-1">
                {['name', 'wine_type', 'price', 'producer'].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 bg-wine/20 text-wine text-xs rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                + <span className="font-medium">year</span> obbligatorio per vini rossi, bianchi, rosé e dolci
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
