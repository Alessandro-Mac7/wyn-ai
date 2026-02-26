'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  SCAN_LOCAL_STORAGE_LIMIT,
  SCAN_LOCAL_STORAGE_KEY,
} from '@/config/constants'
import type { WineScan, WineScanData } from '@/types'

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

interface LocalScan {
  extracted_data: WineScanData
  venue_id: string | null
  matched_wine_id: string | null
  match_confidence: number | null
  scanned_at: string
}

function getLocalScans(): LocalScan[] {
  try {
    const raw = localStorage.getItem(SCAN_LOCAL_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalScan[]
  } catch {
    return []
  }
}

function setLocalScans(scans: LocalScan[]) {
  try {
    localStorage.setItem(SCAN_LOCAL_STORAGE_KEY, JSON.stringify(scans))
  } catch {
    // Storage full or disabled
  }
}

function clearLocalScans() {
  try {
    localStorage.removeItem(SCAN_LOCAL_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

function addLocalScan(scan: WineScan) {
  const local = getLocalScans()
  const entry: LocalScan = {
    extracted_data: scan.extracted_data,
    venue_id: scan.venue_id,
    matched_wine_id: scan.matched_wine_id,
    match_confidence: scan.match_confidence,
    scanned_at: scan.scanned_at,
  }
  const updated = [entry, ...local].slice(0, SCAN_LOCAL_STORAGE_LIMIT)
  setLocalScans(updated)
}

/** Convert localStorage scan to WineScan (with synthetic id) */
function localToWineScan(local: LocalScan, index: number): WineScan {
  return {
    id: `local-${index}`,
    user_id: null,
    venue_id: local.venue_id,
    extracted_data: local.extracted_data,
    matched_wine_id: local.matched_wine_id,
    match_confidence: local.match_confidence,
    scanned_at: local.scanned_at,
    created_at: local.scanned_at,
  }
}

// ============================================
// HOOK
// ============================================

interface UseScanHistoryReturn {
  scans: WineScan[]
  isLoading: boolean
  error: string | null
  isLocal: boolean
  refresh: () => Promise<void>
  deleteScan: (id: string) => Promise<boolean>
  deleteAll: () => Promise<boolean>
  addLocally: (scan: WineScan) => void
}

export function useScanHistory(): UseScanHistoryReturn {
  const { user } = useAuth()
  const [scans, setScans] = useState<WineScan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const syncedRef = useRef(false)

  // Sync localStorage → DB when user logs in
  const syncLocalToServer = useCallback(async () => {
    const local = getLocalScans()
    if (local.length === 0) return

    try {
      const res = await fetch('/api/user/scans/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scans: local }),
      })

      if (res.ok) {
        clearLocalScans()
      }
    } catch {
      // Sync failed silently — will retry next login
    }
  }, [])

  const fetchScans = useCallback(async () => {
    if (!user) {
      // Not logged in: load from localStorage
      const local = getLocalScans()
      setScans(local.map(localToWineScan))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/user/scans')
      if (!res.ok) {
        throw new Error('Errore nel caricamento')
      }
      const data = await res.json()
      setScans(data.scans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // On mount or auth change: sync if needed, then fetch
  useEffect(() => {
    if (user && !syncedRef.current) {
      syncedRef.current = true
      // Sync first, then fetch
      syncLocalToServer().then(() => fetchScans())
    } else if (user) {
      fetchScans()
    } else {
      syncedRef.current = false
      fetchScans()
    }
  }, [user, syncLocalToServer, fetchScans])

  const deleteScan = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      // Delete from localStorage
      const local = getLocalScans()
      const index = parseInt(id.replace('local-', ''))
      if (!isNaN(index)) {
        local.splice(index, 1)
        setLocalScans(local)
        setScans(local.map(localToWineScan))
      }
      return true
    }

    // Optimistic removal
    const prev = scans
    setScans(s => s.filter(scan => scan.id !== id))

    try {
      const res = await fetch('/api/user/scans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: id }),
      })

      if (!res.ok) {
        setScans(prev)
        return false
      }
      return true
    } catch {
      setScans(prev)
      return false
    }
  }, [user, scans])

  const deleteAll = useCallback(async (): Promise<boolean> => {
    if (!user) {
      clearLocalScans()
      setScans([])
      return true
    }

    const prev = scans
    setScans([])

    try {
      const res = await fetch('/api/user/scans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_all: true }),
      })

      if (!res.ok) {
        setScans(prev)
        return false
      }
      return true
    } catch {
      setScans(prev)
      return false
    }
  }, [user, scans])

  const addLocally = useCallback((scan: WineScan) => {
    if (!user) {
      addLocalScan(scan)
      const local = getLocalScans()
      setScans(local.map(localToWineScan))
    } else {
      setScans(prev => [scan, ...prev])
    }
  }, [user])

  return {
    scans,
    isLoading,
    error,
    isLocal: !user,
    refresh: fetchScans,
    deleteScan,
    deleteAll,
    addLocally,
  }
}
