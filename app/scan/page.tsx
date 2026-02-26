'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ScanLine, QrCode, History } from 'lucide-react'
import { LabelScanner } from '@/components/scan/LabelScanner'
import { ScanHistoryList } from '@/components/scan/ScanHistoryList'
import { cn } from '@/lib/utils'

// Code-split QR scanner (camera + html5-qrcode not needed on initial load)
const QrScanner = dynamic(
  () => import('@/components/scan/QrScanner').then(mod => ({ default: mod.QrScanner })),
  { ssr: false }
)

type Tab = 'label' | 'qr' | 'history'

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('label')
  const router = useRouter()

  const handleQrSuccess = useCallback((slug: string) => {
    router.push(`/chat?venue=${slug}&from=qr`)
  }, [router])

  return (
    <div className="fixed-safe flex flex-col overflow-hidden">
      <main id="main-content" className="pl-0 sm:pl-20 flex-1 flex flex-col min-h-0">
        {/* Tab bar */}
        <div className="shrink-0 z-20 flex items-center justify-center px-4 py-2">
          <div className="flex items-center gap-1 p-1 rounded-full glass-ios-subtle">
            <button
              onClick={() => setActiveTab('label')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'label'
                  ? 'bg-wine/20 text-wine'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ScanLine className="h-4 w-4" />
              <span>Etichetta</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'qr'
                  ? 'bg-wine/20 text-wine'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Ristorante</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'history'
                  ? 'bg-wine/20 text-wine'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <History className="h-4 w-4" />
              <span>Storico</span>
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'label' && <LabelScanner />}
            {activeTab === 'qr' && (
              <QrScanner onScanSuccess={handleQrSuccess} />
            )}
            {activeTab === 'history' && <ScanHistoryList />}
          </div>
        </div>
      </main>
    </div>
  )
}
