'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Mountain,
  Beaker,
  Calendar,
  UtensilsCrossed,
  Thermometer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { WineKnowledge, FoodPairingDetailed } from '@/types'

interface WineKnowledgePanelProps {
  wineId: string
  wineName: string
}

interface KnowledgeSection {
  id: string
  title: string
  icon: React.ReactNode
  fields: Array<{
    key: keyof WineKnowledge
    label: string
    multiline?: boolean
  }>
}

const sections: KnowledgeSection[] = [
  {
    id: 'producer',
    title: 'Produttore',
    icon: <BookOpen className="h-5 w-5" />,
    fields: [
      { key: 'producer_history', label: 'Storia del produttore', multiline: true },
      { key: 'producer_philosophy', label: 'Filosofia produttiva', multiline: true },
    ],
  },
  {
    id: 'terroir',
    title: 'Terroir',
    icon: <Mountain className="h-5 w-5" />,
    fields: [
      { key: 'terroir_description', label: 'Descrizione terroir', multiline: true },
      { key: 'vineyard_details', label: 'Dettagli vigneto', multiline: true },
      { key: 'soil_type', label: 'Tipo di suolo' },
      { key: 'climate', label: 'Clima' },
    ],
  },
  {
    id: 'vinification',
    title: 'Vinificazione',
    icon: <Beaker className="h-5 w-5" />,
    fields: [
      { key: 'vinification_process', label: 'Processo di vinificazione', multiline: true },
      { key: 'aging_method', label: 'Metodo di invecchiamento' },
      { key: 'aging_duration', label: 'Durata invecchiamento' },
    ],
  },
  {
    id: 'vintage',
    title: 'Annata',
    icon: <Calendar className="h-5 w-5" />,
    fields: [
      { key: 'vintage_notes', label: 'Note sull\'annata', multiline: true },
      { key: 'vintage_quality', label: 'Qualità annata' },
    ],
  },
  {
    id: 'serving',
    title: 'Servizio',
    icon: <Thermometer className="h-5 w-5" />,
    fields: [
      { key: 'serving_temperature', label: 'Temperatura servizio' },
      { key: 'decanting_time', label: 'Tempo decantazione' },
      { key: 'glass_type', label: 'Tipo di calice' },
    ],
  },
  {
    id: 'curiosities',
    title: 'Curiosità',
    icon: <Sparkles className="h-5 w-5" />,
    fields: [
      { key: 'anecdotes', label: 'Aneddoti', multiline: true },
    ],
  },
]

const vintageQualityLabels: Record<string, string> = {
  eccellente: 'Eccellente',
  ottima: 'Ottima',
  buona: 'Buona',
  media: 'Media',
  scarsa: 'Scarsa',
}

const matchLabels: Record<string, string> = {
  eccellente: 'Eccellente',
  ottimo: 'Ottimo',
  buono: 'Buono',
}

const matchColors: Record<string, string> = {
  eccellente: 'bg-green-900/40 text-green-100 border-green-700',
  ottimo: 'bg-blue-900/40 text-blue-100 border-blue-700',
  buono: 'bg-amber-900/40 text-amber-100 border-amber-700',
}

export function WineKnowledgePanel({ wineId, wineName }: WineKnowledgePanelProps) {
  const [knowledge, setKnowledge] = useState<WineKnowledge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['producer']))
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set())
  const [editedData, setEditedData] = useState<Partial<WineKnowledge>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const fetchKnowledge = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/wines/${wineId}/knowledge`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setKnowledge(data.knowledge)
    } catch (err) {
      console.error('Failed to fetch knowledge:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento della conoscenza')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKnowledge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wineId])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const toggleEditSection = (sectionId: string) => {
    setEditingSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
        // Clear edited data for this section
        const section = sections.find((s) => s.id === sectionId)
        if (section) {
          setEditedData((prevData) => {
            const newData = { ...prevData }
            section.fields.forEach((field) => {
              delete newData[field.key]
            })
            return newData
          })
        }
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const handleFieldChange = (key: keyof WineKnowledge, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [key]: value || null,
    }))
  }

  const handleApprove = async () => {
    if (!knowledge) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/wines/${wineId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reviewed_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Errore nell\'approvazione')
      }

      const data = await response.json()
      setKnowledge(data.knowledge)
    } catch (err) {
      console.error('Failed to approve knowledge:', err)
      setError('Errore nell\'approvazione della conoscenza')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSection = async (sectionId: string) => {
    if (!knowledge) return

    setIsSaving(true)

    try {
      const section = sections.find((s) => s.id === sectionId)
      if (!section) return

      const updates: Partial<WineKnowledge> = {}
      section.fields.forEach((field) => {
        if (field.key in editedData) {
          updates[field.key] = editedData[field.key] as any
        }
      })

      const response = await fetch(`/api/admin/wines/${wineId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Errore nel salvataggio')
      }

      const data = await response.json()
      setKnowledge(data.knowledge)
      toggleEditSection(sectionId)
    } catch (err) {
      console.error('Failed to save section:', err)
      setError('Errore nel salvataggio delle modifiche')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)

    try {
      // Trigger regeneration endpoint
      const response = await fetch(`/api/admin/wines/${wineId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ regenerate: true }),
      })

      if (!response.ok) {
        throw new Error('Errore nella rigenerazione')
      }

      // Refetch knowledge
      await fetchKnowledge()
    } catch (err) {
      console.error('Failed to regenerate knowledge:', err)
      setError('Errore nella rigenerazione della conoscenza')
    } finally {
      setIsRegenerating(false)
    }
  }

  const getFieldValue = (key: keyof WineKnowledge): string => {
    if (key in editedData) {
      const value = editedData[key]
      return value === null ? '' : String(value)
    }
    if (knowledge && knowledge[key] !== null && knowledge[key] !== undefined) {
      const value = knowledge[key]
      if (key === 'vintage_quality') {
        return vintageQualityLabels[value as string] || String(value)
      }
      return String(value)
    }
    return ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-wine" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={fetchKnowledge} variant="outline" size="sm">
          Riprova
        </Button>
      </div>
    )
  }

  if (!knowledge) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessuna conoscenza disponibile</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Genera conoscenza approfondita per questo vino usando l&apos;AI.
          </p>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="bg-wine hover:bg-wine-dark"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Genera Conoscenza
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  const isReviewed = !!knowledge.reviewed_at

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">{wineName}</h2>
            <p className="text-sm text-muted-foreground">Conoscenza approfondita del vino</p>
          </div>
          <div className="flex items-center gap-2">
            {isReviewed ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 text-green-100 border border-green-700">
                <Check className="h-3 w-3" />
                <span className="text-xs font-medium">
                  Rivisto {knowledge.reviewed_at ? formatDate(knowledge.reviewed_at) : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 text-amber-100 border border-amber-700">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium">AI generato</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isReviewed && (
            <Button
              onClick={handleApprove}
              disabled={isSaving}
              className="bg-green-700 hover:bg-green-800 text-white"
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approvazione...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approva
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            variant="outline"
            size="sm"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rigenerazione...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rigenera
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Sections */}
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const isEditing = editingSections.has(section.id)
          const hasContent = section.fields.some(
            (field) => knowledge[field.key] !== null && knowledge[field.key] !== undefined
          )

          return (
            <div
              key={section.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-wine/20 text-wine">
                    {section.icon}
                  </div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  {!hasContent && (
                    <span className="text-xs text-muted-foreground">(Vuoto)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasContent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleEditSection(section.id)
                      }}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-4">
                      {section.fields.map((field) => {
                        const value = getFieldValue(field.key)
                        const isEmpty = !value || value.trim() === ''

                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {field.label}
                            </label>
                            {isEditing ? (
                              field.multiline ? (
                                <Textarea
                                  value={value}
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  placeholder={`Inserisci ${field.label.toLowerCase()}`}
                                  rows={4}
                                  className="bg-secondary"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  placeholder={`Inserisci ${field.label.toLowerCase()}`}
                                  className={cn(
                                    'w-full h-10 px-3 bg-secondary rounded-lg border-0 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-wine',
                                    'placeholder:text-muted-foreground'
                                  )}
                                />
                              )
                            ) : isEmpty ? (
                              <p className="text-sm text-muted-foreground italic">
                                Nessun dato disponibile
                              </p>
                            ) : field.key === 'curiosities' && knowledge.curiosities ? (
                              <ul className="list-disc list-inside space-y-1">
                                {knowledge.curiosities.map((item, idx) => (
                                  <li key={idx} className="text-sm">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{value}</p>
                            )}
                          </div>
                        )
                      })}

                      {isEditing && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleSaveSection(section.id)}
                            disabled={isSaving}
                            size="sm"
                            className="bg-wine hover:bg-wine-dark"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Salva
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => toggleEditSection(section.id)}
                            disabled={isSaving}
                            size="sm"
                            variant="outline"
                          >
                            Annulla
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {/* Food Pairings Section */}
        {knowledge.food_pairings && knowledge.food_pairings.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => toggleSection('pairings')}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-wine/20 text-wine">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">Abbinamenti</h3>
              </div>
              {expandedSections.has('pairings') ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.has('pairings') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-3">
                    {knowledge.food_pairings.map((pairing, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-secondary border border-border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold">{pairing.category}</h4>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full border',
                              matchColors[pairing.match] ||
                                'bg-gray-900/40 text-gray-100 border-gray-700'
                            )}
                          >
                            {matchLabels[pairing.match] || pairing.match}
                          </span>
                        </div>
                        <ul className="space-y-1 mb-2">
                          {pairing.dishes.map((dish, dishIdx) => (
                            <li key={dishIdx} className="text-sm text-muted-foreground">
                              • {dish}
                            </li>
                          ))}
                        </ul>
                        {pairing.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            {pairing.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
