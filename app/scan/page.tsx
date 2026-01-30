'use client'

import { ScanLine } from 'lucide-react'
import { LabelScanner } from '@/components/scan/LabelScanner'

export default function ScanPage() {
  return (
    <div className="fixed-safe flex flex-col overflow-hidden">
      <main id="main-content" className="pl-0 sm:pl-16 flex-1 flex flex-col min-h-0">
        {/* Top bar — same pattern as chat page */}
        <div className="shrink-0 z-20 flex items-center justify-center px-4 py-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-ios-subtle">
            <ScanLine className="h-4 w-4 text-wine" />
            <span className="text-sm font-medium">Scansiona Etichetta</span>
          </div>
        </div>

        {/* Scanner */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <LabelScanner />
          </div>
        </div>
      </main>
    </div>
  )
}
