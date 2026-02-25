'use client'

import { ScanLabelResponse, ScanResult, WineWithRatings, WineType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WineTypeBadge } from '@/components/ui/wine-type-badge'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Sparkles, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScanResultCardProps {
  result: ScanLabelResponse
  onClose: () => void
  onSelectWine?: (wine: WineWithRatings) => void
  onAskAboutScannedWine?: (scanned: ScanResult) => void
  isVenueMode?: boolean
}

// Wine type colors/labels removed - now using WineTypeBadge component

export function ScanResultCard({
  result,
  onClose,
  onSelectWine,
  onAskAboutScannedWine,
  isVenueMode = false
}: ScanResultCardProps) {
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
          <Card variant="glass" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-status-warning">
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
        <Card variant="glass" className="relative">
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
                <WineTypeBadge type={scannedType} size="md" />
              )}
              {scannedYear && (
                <span className="px-2 py-1 rounded text-xs font-medium glass-badge text-muted-foreground">
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

            {/* Match result - only in venue mode */}
            {isVenueMode ? (
              match ? (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                    <h3 className="text-status-success font-semibold">Questo vino è in carta!</h3>
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
                    <Sparkles className="h-5 w-5 text-wine" />
                    <h3 className="text-wine font-semibold">Non in carta, ma ti consiglio:</h3>
                  </div>

                  <div className="space-y-3">
                    {alternatives.map((alt) => (
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
                  <p className="text-status-warning text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Questo vino non è nella carta di questo locale.
                  </p>
                </div>
              )
            ) : (
              /* General mode - ask about scanned wine */
              <div className="border-t border-border pt-4">
                {onAskAboutScannedWine && (
                  <Button
                    onClick={() => onAskAboutScannedWine(scanned)}
                    className="w-full bg-wine hover:bg-wine-dark text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chiedi al sommelier
                  </Button>
                )}
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
    <div className="glass-card rounded-lg p-4 space-y-2">
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
        <WineTypeBadge type={wine.wine_type} size="md" />
        {wine.year && (
          <span className="px-2 py-1 rounded text-xs font-medium glass-badge text-muted-foreground">
            {wine.year}
          </span>
        )}
        {!isAlternative && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-status-success/20 text-status-success border border-status-success/30">
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
              className="px-2 py-1 rounded text-xs font-medium glass-badge text-status-warning"
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
