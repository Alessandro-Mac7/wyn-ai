'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Loader2, LogOut } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useRegisterPanel } from '@/contexts/panel-context'
import { panelSlideVariants, backdropVariants, tabContentVariants } from '@/lib/motion'
import { PrivacySettings } from './PrivacySettings'
import { cn } from '@/lib/utils'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'profile' | 'privacy'

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  useRegisterPanel('profile-modal', isOpen)

  const {
    profile,
    email,
    displayName,
    isAuthenticated,
    updateProfile,
    signOut,
  } = useUserProfile()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Initialize edit name from profile
  useEffect(() => {
    if (displayName) {
      setEditName(displayName)
    }
  }, [displayName])

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile')
      setSaveError(null)
    }
  }, [isOpen])

  const handleSaveName = useCallback(async () => {
    if (!editName.trim() || isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await updateProfile({ display_name: editName.trim() })
    } catch (err) {
      setSaveError('Errore nel salvataggio')
    } finally {
      setIsSaving(false)
    }
  }, [editName, isSaving, updateProfile])

  const handleSignOut = useCallback(async () => {
    await signOut()
    onClose()
  }, [signOut, onClose])

  // Don't render if not authenticated
  if (!isAuthenticated || !profile) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] glass-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className={cn(
              'fixed inset-y-0 right-0 z-[70]',
              'w-full sm:w-[380px] max-w-full',
              'glass-panel',
              'flex flex-col'
            )}
            variants={panelSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-panel-title"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-wine/20">
                  <User className="h-4 w-4 text-wine" />
                </div>
                <h2 id="profile-panel-title" className="text-base font-semibold">
                  Profilo
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 glass-hover rounded-lg"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-white/[0.08]">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-wine border-b-2 border-wine'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Profilo
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'privacy'
                    ? 'text-wine border-b-2 border-wine'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Privacy
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' ? (
                  <motion.div
                    key="profile"
                    custom={-1}
                    variants={tabContentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-4"
                  >
                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-muted-foreground">
                        Email
                      </label>
                      <div className="flex items-center gap-3 p-3 glass-input rounded-xl">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{email}</span>
                      </div>
                    </div>

                    {/* Display name (editable) */}
                    <div>
                      <label htmlFor="display-name" className="block text-sm font-medium mb-2">
                        Nome visualizzato
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            id="display-name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Il tuo nome"
                            maxLength={50}
                            className="w-full pl-10 pr-4 py-3 glass-input text-foreground placeholder:text-muted-foreground/50"
                          />
                        </div>
                        {editName !== (displayName || '') && (
                          <button
                            onClick={handleSaveName}
                            disabled={isSaving || !editName.trim()}
                            className="px-4 py-3 rounded-xl bg-wine text-white text-sm font-medium hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Salva'
                            )}
                          </button>
                        )}
                      </div>
                      {saveError && (
                        <p className="text-xs text-destructive mt-1">{saveError}</p>
                      )}
                    </div>

                    {/* Account info */}
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-muted-foreground">
                        Account creato il {new Date(profile.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>

                    {/* Sign out button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/[0.15] text-muted-foreground hover:text-foreground glass-hover"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Esci</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="privacy"
                    custom={1}
                    variants={tabContentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <PrivacySettings />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
