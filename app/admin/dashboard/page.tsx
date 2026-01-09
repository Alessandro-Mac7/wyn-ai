'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowLeft, Search, Upload, QrCode } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useAdminSession } from '@/hooks/useAdminSession'
import { usePaginatedWines } from '@/hooks/usePaginatedWines'
import {
  WineCard,
  WineCardSkeleton,
  WineFilters,
  WineSidebar,
  CsvUploadDialog,
  CsvPreviewModal,
  QrCodeDialog,
} from '@/components/admin'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { WineType, WineWithRatings, CsvParseResult, BulkImportResponse } from '@/types'

type FilterValue = WineType | 'all'

export default function AdminDashboardPage() {
  const router = useRouter()
  const {
    user,
    venue,
    isReady,
    signOut,
    refreshEnrichment,
  } = useAdminSession()

  // Use paginated wines hook
  const {
    wines,
    total,
    isLoading: isLoadingWines,
    isLoadingMore,
    hasMore,
    searchQuery,
    filterType,
    loadMore,
    search,
    setFilter,
    refresh,
    addWine,
    updateWine,
    removeWine,
  } = usePaginatedWines({ venueId: venue?.id || null })

  const [showSidebar, setShowSidebar] = useState(false)
  const [editingWine, setEditingWine] = useState<WineWithRatings | null>(null)

  // CSV Upload state
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [csvParseResult, setCsvParseResult] = useState<CsvParseResult | null>(null)

  // QR Code dialog state
  const [showQrCode, setShowQrCode] = useState(false)

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoadingWines) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, isLoadingWines, loadMore])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    router.push('/admin')
  }

  // Handle CSV parsed result
  const handleCsvParsed = useCallback((result: CsvParseResult) => {
    setCsvParseResult(result)
    setShowCsvUpload(false)
  }, [])

  // Handle bulk import complete
  const handleImportComplete = useCallback((result: BulkImportResponse) => {
    // Refresh wine list after successful import
    if (result.imported > 0) {
      refresh()
    }
  }, [refresh])

  // Single loading check - wait for auth to be ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Caricamento..." />
      </div>
    )
  }

  // No user after ready - redirect to login
  if (!user) {
    router.push('/admin')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Reindirizzamento..." />
      </div>
    )
  }

  // Venue admin but no venue associated
  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">
          Nessun locale associato al tuo account.
        </p>
        <p className="text-sm text-muted-foreground">
          Contatta l&apos;amministratore per associare un locale.
        </p>
        <Button variant="outline" onClick={handleSignOut}>
          Esci
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/wyn-icon.ico"
              alt="WYN"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="mina-regular text-lg">WINEBOARD</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna all&apos;app
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Gestione Vini' },
          ]}
          className="mb-6"
        />

        {/* Title and Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="mina-regular text-3xl">GESTIONE VINI</h1>
            <p className="text-muted-foreground">
              {venue.name} &bull; {total} vini
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQrCode(true)}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCsvUpload(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importa CSV
            </Button>
            <Button
              onClick={() => {
                setEditingWine(null)
                setShowSidebar(true)
              }}
              className="bg-wine hover:bg-wine-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Vino
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca vini..."
              value={searchQuery}
              onChange={(e) => search(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine"
            />
          </div>
          <WineFilters selected={filterType} onChange={setFilter} />
        </div>

        {/* Initial loading skeleton */}
        {isLoadingWines && wines.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <WineCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Wine Grid */}
        {wines.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {wines.map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                onToggle={(available) => updateWine(wine.id, { available })}
                onToggleRecommended={(recommended) => updateWine(wine.id, { recommended })}
                onEdit={() => {
                  setEditingWine(wine)
                  setShowSidebar(true)
                }}
                onDelete={() => removeWine(wine.id)}
                onRefresh={() => refreshEnrichment(wine.id)}
              />
            ))}
          </div>
        )}

        {/* Load More Trigger (Infinite Scroll) */}
        {wines.length > 0 && (
          <div
            ref={loadMoreTriggerRef}
            className="h-20 flex items-center justify-center mt-4"
          >
            {isLoadingMore && (
              <LoadingSpinner message="Caricamento altri vini..." size="sm" />
            )}
            {!hasMore && wines.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Hai visualizzato tutti i {total} vini
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoadingWines && wines.length === 0 && (
          <div className="text-center py-16">
            <Image
              src="/wyn-icon.ico"
              alt="WYN"
              width={48}
              height={48}
              className="w-12 h-12 mx-auto mb-4 opacity-50"
            />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Nessun vino trovato con i filtri selezionati'
                : 'Nessun vino nel catalogo'}
            </p>
            {total === 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowCsvUpload(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importa da CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingWine(null)
                    setShowSidebar(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi il primo vino
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Wine Sidebar */}
      <WineSidebar
        isOpen={showSidebar}
        onClose={() => {
          setShowSidebar(false)
          setEditingWine(null)
        }}
        editWine={editingWine}
        onSave={async (input, wineId) => {
          if (wineId) {
            await updateWine(wineId, input)
          } else {
            await addWine(input)
          }
          setShowSidebar(false)
          setEditingWine(null)
        }}
      />

      {/* CSV Upload Dialog */}
      <CsvUploadDialog
        isOpen={showCsvUpload}
        onClose={() => setShowCsvUpload(false)}
        onParsed={handleCsvParsed}
      />

      {/* CSV Preview Modal */}
      {csvParseResult && (
        <CsvPreviewModal
          isOpen={!!csvParseResult}
          onClose={() => setCsvParseResult(null)}
          parseResult={csvParseResult}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* QR Code Dialog */}
      <QrCodeDialog
        isOpen={showQrCode}
        onClose={() => setShowQrCode(false)}
        venue={{ slug: venue.slug, name: venue.name }}
      />
    </div>
  )
}
