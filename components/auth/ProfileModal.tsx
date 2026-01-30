'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Loader2, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useRegisterPanel } from '@/contexts/panel-context'
import { PrivacySettings } from './PrivacySettings'

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
    isLoading,
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

  // Reset state when modal closes
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-2 xs:inset-x-4 top-[5%] bottom-[5%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:max-h-[80vh] overflow-hidden z-[70] safe-bottom"
          >
            <div className="bg-card border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-full sm:max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="font-semibold">Profilo</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5 transition-colors"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {/* Email (read-only) */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                          Email
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-background/50 border border-white/10 rounded-xl">
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
                              className="w-full pl-10 pr-4 py-3 bg-background/50 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-wine/50"
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
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Esci</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <PrivacySettings />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
