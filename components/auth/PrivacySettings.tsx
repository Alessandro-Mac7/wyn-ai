'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Eye,
  Mail,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'

export function PrivacySettings() {
  const {
    profile,
    hasGdprConsent,
    hasProfilingConsent,
    hasMarketingConsent,
    updateConsent,
  } = useUserProfile()

  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  // Optimistic state for toggle switches
  const [optimisticProfiling, setOptimisticProfiling] = useState<boolean | null>(null)
  const [optimisticMarketing, setOptimisticMarketing] = useState<boolean | null>(null)

  const handleToggleConsent = useCallback(
    async (type: 'profiling' | 'marketing', value: boolean) => {
      setIsUpdating(type)
      setUpdateError(null)

      // Apply optimistic update immediately
      if (type === 'profiling') {
        setOptimisticProfiling(value)
      } else {
        setOptimisticMarketing(value)
      }

      try {
        await updateConsent({
          [`${type}_consent`]: value,
        })
        // Clear optimistic state on success (real state now matches)
        if (type === 'profiling') {
          setOptimisticProfiling(null)
        } else {
          setOptimisticMarketing(null)
        }
      } catch (err) {
        // Revert optimistic update on error
        if (type === 'profiling') {
          setOptimisticProfiling(null)
        } else {
          setOptimisticMarketing(null)
        }
        setUpdateError(`Errore nell'aggiornamento`)
      } finally {
        setIsUpdating(null)
      }
    },
    [updateConsent]
  )

  // Use optimistic values if available, otherwise use real values
  const displayProfilingConsent = optimisticProfiling ?? hasProfilingConsent
  const displayMarketingConsent = optimisticMarketing ?? hasMarketingConsent

  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* GDPR Status */}
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Consenso GDPR attivo</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Hai acconsentito al trattamento dei tuoi dati il{' '}
              {hasGdprConsent
                ? new Date(profile.gdpr_consent_at!).toLocaleDateString('it-IT')
                : 'N/D'}
            </p>
          </div>
        </div>
      </div>

      {/* Consent toggles */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Impostazioni consenso</h4>

        {/* Profiling consent */}
        <div className="p-4 bg-background/50 border border-white/10 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h5 className="font-medium text-sm">Profilazione</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Consente a WYN di apprendere i tuoi gusti dalle conversazioni per offrirti consigli personalizzati
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleConsent('profiling', !displayProfilingConsent)}
              disabled={isUpdating === 'profiling'}
              role="switch"
              aria-checked={displayProfilingConsent}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                displayProfilingConsent ? 'bg-green-500' : 'bg-muted'
              } ${isUpdating === 'profiling' ? 'opacity-50' : ''}`}
              aria-label={displayProfilingConsent ? 'Disattiva profilazione' : 'Attiva profilazione'}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  displayProfilingConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isUpdating === 'profiling' && (
                <Loader2 className="w-4 h-4 text-white absolute top-1.5 left-4 animate-spin" />
              )}
            </button>
          </div>
        </div>

        {/* Marketing consent */}
        <div className="p-4 bg-background/50 border border-white/10 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h5 className="font-medium text-sm">Comunicazioni marketing</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Ricevi novità, offerte speciali e suggerimenti via email
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleConsent('marketing', !displayMarketingConsent)}
              disabled={isUpdating === 'marketing'}
              role="switch"
              aria-checked={displayMarketingConsent}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                displayMarketingConsent ? 'bg-green-500' : 'bg-muted'
              } ${isUpdating === 'marketing' ? 'opacity-50' : ''}`}
              aria-label={displayMarketingConsent ? 'Disattiva marketing' : 'Attiva marketing'}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  displayMarketingConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isUpdating === 'marketing' && (
                <Loader2 className="w-4 h-4 text-white absolute top-1.5 left-4 animate-spin" />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {updateError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm text-destructive"
            >
              {updateError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Data management */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h4 className="font-medium text-sm">Gestione dati</h4>

        <DataExportButton />
        <DeleteAccountButton />
      </div>
    </div>
  )
}

// ============================================
// DATA EXPORT BUTTON
// ============================================

function DataExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportError(null)
    setExportSuccess(false)

    try {
      const response = await fetch('/api/user/export')
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wyn-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (err) {
      setExportError('Errore durante l\'esportazione')
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-between p-4 bg-background/50 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <h5 className="font-medium text-sm">Esporta i tuoi dati</h5>
            <p className="text-xs text-muted-foreground">
              Scarica una copia di tutti i tuoi dati in formato JSON
            </p>
          </div>
        </div>
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : exportSuccess ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : null}
      </button>
      {exportError && (
        <p className="text-xs text-destructive mt-1 ml-1">{exportError}</p>
      )}
    </div>
  )
}

// ============================================
// DELETE ACCOUNT BUTTON
// ============================================

function DeleteAccountButton() {
  const { signOut } = useUserProfile()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Sign out and redirect
      await signOut()
      window.location.href = '/'
    } catch (err) {
      setDeleteError('Errore durante la cancellazione')
      setIsDeleting(false)
    }
  }, [signOut])

  return (
    <div>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-destructive" />
          <div className="text-left">
            <h5 className="font-medium text-sm text-destructive">Elimina account</h5>
            <p className="text-xs text-muted-foreground">
              Cancella definitivamente il tuo account e tutti i dati
            </p>
          </div>
        </div>
      </button>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm z-50"
            >
              <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Conferma eliminazione</h3>
                    <p className="text-xs text-muted-foreground">
                      Questa azione è irreversibile
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Tutti i tuoi dati verranno eliminati permanentemente, inclusi profilo, storico chat e preferenze.
                </p>

                {deleteError && (
                  <p className="text-sm text-destructive mb-4">{deleteError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Eliminazione...</span>
                      </>
                    ) : (
                      'Elimina account'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
