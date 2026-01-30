'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { LabelScanner } from '@/components/scan/LabelScanner'
import { cn } from '@/lib/utils'

export default function ScanPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <main id="main-content" className="pl-0 sm:pl-16 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 safe-top">
          <div className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-lg border-b border-border/50">
            <button
              onClick={() => router.back()}
              className={cn(
                'p-2 -ml-2 rounded-lg transition-colors',
                'hover:bg-secondary text-muted-foreground hover:text-foreground'
              )}
              aria-label="Torna indietro"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-wine" />
              <h1 className="text-lg font-semibold">Scansiona Etichetta</h1>
            </div>
          </div>
        </div>

        {/* Scanner */}
        <div className="p-4 max-w-2xl mx-auto">
          <LabelScanner />
        </div>
      </main>
    </div>
  )
}
