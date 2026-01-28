'use client'

import { useState, useCallback } from 'react'
import { useSession } from '@/contexts/session-context'
import { useChat } from '@/hooks/useChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { QuickSuggestions } from './QuickSuggestions'
import { ScanResultCard } from '@/components/scan/ScanResultCard'
import { GENERAL_SUGGESTIONS, VENUE_SUGGESTIONS } from '@/lib/prompts'
import type { ScanLabelResponse, ScanResult, WineWithRatings } from '@/types'

interface ChatContainerProps {
  venueName?: string
}

export function ChatContainer({ venueName }: ChatContainerProps) {
  const { venueSlug } = useSession()
  const { messages, isLoading, error, sendMessage } = useChat()

  // Scan state
  const [scanResult, setScanResult] = useState<ScanLabelResponse | null>(null)
  const [isScanLoading, setIsScanLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const suggestions = venueSlug ? VENUE_SUGGESTIONS : GENERAL_SUGGESTIONS

  // Handle wine label scan
  const handleScan = useCallback(async (imageDataUrl: string) => {
    setIsScanLoading(true)
    setScanError(null)
    setScanResult(null)

    try {
      const response = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          venue_slug: venueSlug,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella scansione')
      }

      const data: ScanLabelResponse = await response.json()
      setScanResult(data)
    } catch (err) {
      console.error('Scan error:', err)
      setScanError(err instanceof Error ? err.message : 'Errore nella scansione')
    } finally {
      setIsScanLoading(false)
    }
  }, [venueSlug])

  // Handle closing scan result
  const handleCloseScanResult = useCallback(() => {
    setScanResult(null)
    setScanError(null)
  }, [])

  // Handle selecting a wine from scan results
  const handleSelectWine = useCallback((wine: WineWithRatings) => {
    // Send a message about the selected wine
    sendMessage(`Parlami di questo vino: ${wine.name}${wine.producer ? ` di ${wine.producer}` : ''}`)
    setScanResult(null)
  }, [sendMessage])

  // Handle asking about a scanned wine (general mode)
  const handleAskAboutScannedWine = useCallback((scanned: ScanResult) => {
    const parts = [scanned.name || 'questo vino']
    if (scanned.producer) parts.push(`di ${scanned.producer}`)
    if (scanned.year) parts.push(`(${scanned.year})`)
    if (scanned.region) parts.push(`dalla regione ${scanned.region}`)

    sendMessage(`Ho scansionato un'etichetta. Parlami di ${parts.join(' ')}. Quali sono le sue caratteristiche e con cosa lo abbineresti?`)
    setScanResult(null)
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={sendMessage}
            disabled={isLoading}
          />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Scan result display */}
      {scanResult && (
        <div className="px-4 py-2 safe-bottom">
          <ScanResultCard
            result={scanResult}
            onClose={handleCloseScanResult}
            onSelectWine={handleSelectWine}
            onAskAboutScannedWine={handleAskAboutScannedWine}
            isVenueMode={!!venueSlug}
          />
        </div>
      )}

      {/* Error display */}
      {(error || scanError) && (
        <div className="px-4 py-2 text-sm text-red-400 bg-red-900/20">
          {error || scanError}
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        onImageScan={handleScan}
        isLoading={isLoading}
        isScanLoading={isScanLoading}
        hasError={!!error || !!scanError}
        showImageAttachment={true}
        placeholder={
          venueSlug
            ? `Chiedimi dei vini di ${venueName || 'questo ristorante'}...`
            : 'Chiedimi qualsiasi cosa sul vino...'
        }
      />
    </div>
  )
}
