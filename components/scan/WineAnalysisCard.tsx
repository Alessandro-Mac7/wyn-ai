'use client'

import { motion } from 'framer-motion'
import { Wine, Star, Utensils, BarChart3, Grape, DollarSign, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WineAnalysis } from '@/types'

interface WineAnalysisCardProps {
  analysis: WineAnalysis
}

const wineTypeLabels: Record<string, { label: string; color: string }> = {
  red: { label: 'Rosso', color: 'bg-red-500/20 text-red-400' },
  white: { label: 'Bianco', color: 'bg-amber-500/20 text-amber-400' },
  rose: { label: 'Rosato', color: 'bg-pink-500/20 text-pink-400' },
  sparkling: { label: 'Spumante', color: 'bg-purple-500/20 text-purple-400' },
  dessert: { label: 'Dessert', color: 'bg-orange-500/20 text-orange-400' },
}

const matchQualityLabels: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Perfetto', color: 'text-green-400' },
  very_good: { label: 'Ottimo', color: 'text-blue-400' },
  good: { label: 'Buono', color: 'text-muted-foreground' },
}

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  },
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <motion.div variants={stagger.item} className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </motion.div>
  )
}

function CharBar({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  const levels: Record<string, number> = {
    'leggero': 25, 'morbidi': 25, 'bassa': 25, 'secco': 25, 'breve': 25,
    'medio': 50, 'medi': 50, 'media': 50, 'abboccato': 40,
    'pieno': 75, 'decisi': 75, 'vivace': 75, 'amabile': 65, 'importante': 75, 'lungo': 75,
    'molto pieno': 90, 'potenti': 90, 'alta': 90, 'dolce': 90, 'elevato': 90, 'persistente': 90,
    'molto intensa': 95, 'intensa': 75, 'leggera': 25,
  }
  const pct = levels[value.toLowerCase()] ?? 50

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-wine rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
      <span className="text-xs text-foreground w-20 text-right capitalize">{value}</span>
    </div>
  )
}

export function WineAnalysisCard({ analysis }: WineAnalysisCardProps) {
  const { basic, evaluation, aromatic_profile, characteristics, food_pairings, guide_ratings, user_ratings, price_info } = analysis
  const typeInfo = basic.wine_type ? wineTypeLabels[basic.wine_type] : null

  return (
    <motion.div
      className="space-y-5"
      variants={stagger.container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={stagger.item} className="space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          {typeInfo && (
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', typeInfo.color)}>
              {typeInfo.label}
            </span>
          )}
          {basic.year && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
              {basic.year}
            </span>
          )}
          {basic.denomination && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
              {basic.denomination}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold leading-tight">{basic.name || 'Vino sconosciuto'}</h3>
        {basic.producer && (
          <p className="text-sm text-muted-foreground">{basic.producer}</p>
        )}
        {basic.region && (
          <p className="text-xs text-muted-foreground">{basic.region}</p>
        )}
      </motion.div>

      {/* Quality Score + Summary */}
      <Section title="Valutazione" icon={Star}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-wine/20">
            <span className="text-lg font-bold text-wine">{evaluation.quality_score}</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex gap-2 flex-wrap">
              {evaluation.style && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground capitalize">
                  {evaluation.style}
                </span>
              )}
              {evaluation.aging_potential && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {evaluation.aging_potential.replace('_', ' ')}
                </span>
              )}
              {evaluation.complexity && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground capitalize">
                  {evaluation.complexity}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{evaluation.summary}</p>
      </Section>

      {/* Aromatic Profile */}
      {aromatic_profile.primary_aromas.length > 0 && (
        <Section title="Profilo aromatico" icon={Grape}>
          {aromatic_profile.intensity && (
            <p className="text-xs text-muted-foreground">
              Intensità: <span className="text-foreground capitalize">{aromatic_profile.intensity}</span>
            </p>
          )}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {aromatic_profile.primary_aromas.map((a) => (
                <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-wine/10 text-wine">
                  {a}
                </span>
              ))}
            </div>
            {aromatic_profile.secondary_aromas && aromatic_profile.secondary_aromas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {aromatic_profile.secondary_aromas.map((a) => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            )}
            {aromatic_profile.tertiary_aromas && aromatic_profile.tertiary_aromas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {aromatic_profile.tertiary_aromas.map((a) => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Characteristics */}
      <Section title="Caratteristiche" icon={BarChart3}>
        <div className="space-y-2">
          <CharBar label="Corpo" value={characteristics.body} />
          <CharBar label="Tannini" value={characteristics.tannins} />
          <CharBar label="Acidità" value={characteristics.acidity} />
          <CharBar label="Dolcezza" value={characteristics.sweetness} />
          <CharBar label="Alcol" value={characteristics.alcohol} />
          <CharBar label="Finale" value={characteristics.finish} />
        </div>
      </Section>

      {/* Food Pairings */}
      {food_pairings.length > 0 && (
        <Section title="Abbinamenti" icon={Utensils}>
          <div className="space-y-2">
            {food_pairings.map((fp, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{fp.category}</span>
                  <span className={cn('text-[10px]', matchQualityLabels[fp.match_quality]?.color)}>
                    {matchQualityLabels[fp.match_quality]?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fp.dishes.join(', ')}
                </p>
                {fp.notes && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{fp.notes}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ratings */}
      {(guide_ratings.length > 0 || user_ratings.length > 0) && (
        <Section title="Valutazioni" icon={Wine}>
          <div className="space-y-1.5">
            {guide_ratings.map((gr, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{gr.guide}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{gr.rating}</span>
                  {gr.year && <span className="text-muted-foreground/60">({gr.year})</span>}
                </div>
              </div>
            ))}
            {user_ratings.map((ur, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{ur.platform}</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{ur.rating.toFixed(1)}</span>
                  {ur.review_count && (
                    <span className="text-muted-foreground/60">({ur.review_count})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Price */}
      {price_info.estimated_range && (
        <Section title="Prezzo" icon={DollarSign}>
          <div className="flex items-center justify-between text-sm">
            <span>
              €{price_info.estimated_range.min} – €{price_info.estimated_range.max}
            </span>
            {price_info.value_rating && (
              <span className="text-xs text-muted-foreground capitalize">
                {price_info.value_rating}
              </span>
            )}
          </div>
          {price_info.market_position && (
            <p className="text-[10px] text-muted-foreground capitalize">
              Posizione: {price_info.market_position}
            </p>
          )}
        </Section>
      )}
    </motion.div>
  )
}
