'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
          <div className="relative inline-flex items-center rounded-full glass-ios-subtle p-0.5">
            <button
              onClick={() => setActiveTab('label')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]',
                activeTab === 'label' ? 'text-white' : 'text-muted-foreground'
              )}
            >
              {activeTab === 'label' && (
                <motion.div
                  layoutId="scan-pill"
                  className="absolute inset-0 bg-wine rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <ScanLine className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">Etichetta</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]',
                activeTab === 'qr' ? 'text-white' : 'text-muted-foreground'
              )}
            >
              {activeTab === 'qr' && (
                <motion.div
                  layoutId="scan-pill"
                  className="absolute inset-0 bg-wine rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <QrCode className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">QR</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]',
                activeTab === 'history' ? 'text-white' : 'text-muted-foreground'
              )}
            >
              {activeTab === 'history' && (
                <motion.div
                  layoutId="scan-pill"
                  className="absolute inset-0 bg-wine rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <History className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">Storico</span>
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
