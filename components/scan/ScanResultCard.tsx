'use client'

import { ScanLabelResponse, WineWithRatings, WineType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScanResultCardProps {
  result: ScanLabelResponse
  onClose: () => void
  onSelectWine?: (wine: WineWithRatings) => void
}

const wineTypeColors: Record<WineType, string> = {
  red: '#dc2626',
  white: '#d97706',
  rose: '#db2777',
  sparkling: '#7c3aed',
  dessert: '#f59e0b',
}

const wineTypeLabels: Record<WineType, string> = {
  red: 'Rosso',
  white: 'Bianco',
  rose: 'Rosé',
  sparkling: 'Spumante',
  dessert: 'Dolce',
}

export function ScanResultCard({ result, onClose, onSelectWine }: ScanResultCardProps) {
  const { scanned, match, alternatives, success, message } = result

  // Low confidence or error case
  if (!success || !scanned || scanned.confidence < 0.4) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative bg-card border-border">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-5 w-5" />
                Non riesco a leggere bene l&apos;etichetta
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground text-sm">
                {message || 'Prova a scattare una foto più nitida con buona illuminazione, assicurandoti che l\'etichetta sia ben visibile.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Build scanned wine display
  const scannedWineName = scanned.name || 'Vino sconosciuto'
  const scannedProducer = scanned.producer
  const scannedYear = scanned.year
  const scannedRegion = scanned.region
  const scannedType = scanned.wine_type

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative bg-card border-border">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader>
            <CardTitle className="text-foreground pr-8">
              {scannedWineName}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {scannedType && (
                <span
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: wineTypeColors[scannedType] }}
                >
                  {wineTypeLabels[scannedType]}
                </span>
              )}
              {scannedYear && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground">
                  {scannedYear}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Scanned wine info */}
            <div className="text-sm space-y-1">
              {scannedProducer && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Produttore:</span> {scannedProducer}
                </p>
              )}
              {scannedRegion && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Regione:</span> {scannedRegion}
                </p>
              )}
              {scanned.denomination && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Denominazione:</span> {scanned.denomination}
                </p>
              )}
              {scanned.grape_varieties && scanned.grape_varieties.length > 0 && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Uve:</span> {scanned.grape_varieties.join(', ')}
                </p>
              )}
            </div>

            {/* Match result */}
            {match ? (
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-green-400 font-semibold">Questo vino è in carta!</h3>
                </div>

                <WineMatchCard
                  wine={match.wine}
                  matchQuality={match.matchQuality}
                  onSelect={onSelectWine}
                />
              </div>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <h3 className="text-blue-400 font-semibold">Non in carta, ma ti consiglio:</h3>
                </div>

                <div className="space-y-3">
                  {alternatives.map((alt, index) => (
                    <WineMatchCard
                      key={alt.wine.id}
                      wine={alt.wine}
                      matchQuality={alt.matchQuality}
                      onSelect={onSelectWine}
                      isAlternative
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t border-border pt-4">
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Questo vino non è nella carta di questo locale.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

interface WineMatchCardProps {
  wine: WineWithRatings
  matchQuality: 'exact' | 'high' | 'partial'
  onSelect?: (wine: WineWithRatings) => void
  isAlternative?: boolean
}

function WineMatchCard({ wine, matchQuality, onSelect, isAlternative }: WineMatchCardProps) {
  const matchLabels = {
    exact: 'Corrispondenza esatta',
    high: 'Ottima corrispondenza',
    partial: 'Corrispondenza parziale',
  }

  return (
    <div className="bg-secondary rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{wine.name}</h4>
          {wine.producer && (
            <p className="text-sm text-muted-foreground">{wine.producer}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-wine">€{wine.price.toFixed(2)}</p>
          {wine.price_glass && (
            <p className="text-xs text-muted-foreground">€{wine.price_glass.toFixed(2)} al calice</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className="px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: wineTypeColors[wine.wine_type] }}
        >
          {wineTypeLabels[wine.wine_type]}
        </span>
        {wine.year && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-card text-muted-foreground">
            {wine.year}
          </span>
        )}
        {!isAlternative && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
            {matchLabels[matchQuality]}
          </span>
        )}
      </div>

      {wine.region && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Regione:</span> {wine.region}
        </p>
      )}

      {wine.ratings && wine.ratings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wine.ratings.map((rating) => (
            <span
              key={rating.id}
              className="px-2 py-1 rounded text-xs font-medium bg-card/50 text-yellow-400 border border-border"
            >
              ⭐ {rating.guide_name}: {rating.score}
            </span>
          ))}
        </div>
      )}

      {wine.description && (
        <p className="text-sm text-muted-foreground mt-2">{wine.description}</p>
      )}

      {onSelect && (
        <Button
          onClick={() => onSelect(wine)}
          className="w-full mt-3 bg-wine hover:bg-wine-dark text-white"
        >
          Scopri di più
        </Button>
      )}
    </div>
  )
}
