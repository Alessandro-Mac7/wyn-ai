'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, LogIn, Wine, Trash2, Loader2 } from 'lucide-react'
import { useScanHistory } from '@/hooks/useScanHistory'
import { ScanHistoryItem } from './ScanHistoryItem'
import { ScanHistoryDetail } from './ScanHistoryDetail'
import { listContainerVariants, listItemVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { WineScan } from '@/types'

interface ScanHistoryListProps {
  onRequestLogin?: () => void
}

type DateGroup = {
  label: string
  scans: WineScan[]
}

function groupByDate(scans: WineScan[]): DateGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: Record<string, WineScan[]> = {}

  for (const scan of scans) {
    const d = new Date(scan.scanned_at)
    const scanDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    let label: string
    if (scanDate >= today) {
      label = 'Oggi'
    } else if (scanDate >= yesterday) {
      label = 'Ieri'
    } else if (scanDate >= weekAgo) {
      label = 'Questa settimana'
    } else {
      label = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      label = label.charAt(0).toUpperCase() + label.slice(1)
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(scan)
  }

  return Object.entries(groups).map(([label, scans]) => ({ label, scans }))
}

export function ScanHistoryList({ onRequestLogin }: ScanHistoryListProps) {
  const { scans, isLoading, isLocal, deleteScan, deleteAll } = useScanHistory()
  const [selectedScan, setSelectedScan] = useState<WineScan | null>(null)

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-5 w-5 text-wine animate-spin" />
      </div>
    )
  }

  // Detail view
  if (selectedScan) {
    return (
      <div className="p-4">
        <ScanHistoryDetail
          scan={selectedScan}
          onBack={() => setSelectedScan(null)}
          onDelete={(id) => {
            deleteScan(id)
            setSelectedScan(null)
          }}
        />
      </div>
    )
  }

  // Empty state
  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5">
          <Wine className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Nessuna scansione</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scansiona un&apos;etichetta per iniziare
          </p>
        </div>
      </div>
    )
  }

  const groups = groupByDate(scans)

  return (
    <div className="p-4 space-y-4">
      {/* Login banner for local-only scans */}
      {isLocal && (
        <button
          onClick={onRequestLogin}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl',
            'border border-wine/20 bg-wine/5',
            'hover:bg-wine/10 transition-colors'
          )}
        >
          <LogIn className="h-4 w-4 text-wine shrink-0" />
          <div className="text-left">
            <p className="text-xs font-medium text-wine">Accedi per non perdere le scansioni</p>
            <p className="text-[10px] text-muted-foreground">
              Solo le ultime 5 sono salvate sul dispositivo
            </p>
          </div>
        </button>
      )}

      {/* Header with delete all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {scans.length} {scans.length === 1 ? 'scansione' : 'scansioni'}
          </span>
        </div>
        <button
          onClick={deleteAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Elimina tutto
        </button>
      </div>

      {/* Grouped list */}
      <motion.div
        className="space-y-4"
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {groups.map((group) => (
          <motion.div key={group.label} variants={listItemVariants} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.scans.map((scan) => (
                <ScanHistoryItem
                  key={scan.id}
                  scan={scan}
                  onSelect={setSelectedScan}
                  onDelete={deleteScan}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
