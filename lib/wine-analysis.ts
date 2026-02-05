/**
 * Wine analysis module
 * Takes OCR ScanResult and produces comprehensive WineAnalysis via LLM
 */

import type { ChatMessage, ScanResult, WineAnalysis } from '@/types'
import { chat } from '@/lib/llm'
import { searchWineImage } from '@/lib/wine-image-search'

// ============================================
// ANALYSIS PROMPT
// ============================================

function buildAnalysisPrompt(scan: ScanResult): string {
  const parts: string[] = []
  if (scan.name) parts.push(`Nome: ${scan.name}`)
  if (scan.producer) parts.push(`Produttore: ${scan.producer}`)
  if (scan.year) parts.push(`Annata: ${scan.year}`)
  if (scan.wine_type) parts.push(`Tipo: ${scan.wine_type}`)
  if (scan.region) parts.push(`Regione: ${scan.region}`)
  if (scan.denomination) parts.push(`Denominazione: ${scan.denomination}`)
  if (scan.grape_varieties?.length) parts.push(`Vitigni: ${scan.grape_varieties.join(', ')}`)

  return `Sei un sommelier esperto italiano. Analizza questo vino e fornisci una valutazione completa in formato JSON.

DATI ETICHETTA:
${parts.join('\n')}

Rispondi SOLO con JSON valido nel seguente formato (senza markdown):
{
  "evaluation": {
    "quality_score": <0-100>,
    "style": "classic" | "modern" | "natural" | "traditional" | null,
    "aging_potential": "drink_now" | "short_term" | "medium_term" | "long_term" | null,
    "complexity": "semplice" | "media" | "complessa" | "eccezionale" | null,
    "summary": "<2-3 frasi in italiano che descrivono il vino>"
  },
  "aromatic_profile": {
    "intensity": "leggera" | "media" | "intensa" | "molto intensa" | null,
    "primary_aromas": ["<aroma1>", "<aroma2>"],
    "secondary_aromas": ["<aroma>"] | null,
    "tertiary_aromas": ["<aroma>"] | null
  },
  "characteristics": {
    "body": "leggero" | "medio" | "pieno" | "molto pieno" | null,
    "tannins": "morbidi" | "medi" | "decisi" | "potenti" | null,
    "acidity": "bassa" | "media" | "vivace" | "alta" | null,
    "sweetness": "secco" | "abboccato" | "amabile" | "dolce" | null,
    "alcohol": "leggero" | "medio" | "importante" | "elevato" | null,
    "finish": "breve" | "medio" | "lungo" | "persistente" | null
  },
  "food_pairings": [
    {
      "category": "<es: Primi piatti, Carni rosse, Formaggi>",
      "dishes": ["<piatto1>", "<piatto2>"],
      "match_quality": "excellent" | "very_good" | "good",
      "notes": "<nota opzionale>"
    }
  ],
  "guide_ratings": [
    {
      "guide": "<nome guida: Gambero Rosso, Veronelli, Wine Spectator, etc.>",
      "rating": "<punteggio nel formato della guida>",
      "year": <anno edizione o null>,
      "confidence": <0.0-1.0>
    }
  ],
  "user_ratings": [
    {
      "platform": "<Vivino, Wine-Searcher, etc.>",
      "rating": <1.0-5.0>,
      "review_count": <numero o null>,
      "confidence": <0.0-1.0>
    }
  ],
  "price_info": {
    "estimated_range": { "min": <euro>, "max": <euro> } | null,
    "value_rating": "eccezionale" | "ottimo" | "buono" | "nella media" | "costoso" | null,
    "market_position": "entry-level" | "medio" | "premium" | "super-premium" | "lusso" | null
  },
  "confidence": <0.0-1.0 confidence complessiva dell'analisi>
}

REGOLE:
- Se non conosci un dato con certezza, usa null
- I punteggi guide devono riflettere punteggi reali se li conosci, altrimenti ometti
- Gli aromi devono essere specifici (es: "ciliegia matura" non solo "frutta")
- I prezzi sono in euro, range retail italiano
- confidence riflette quanto sei sicuro dell'analisi complessiva
- Fornisci almeno 3 abbinamenti cibo
- Rispondi SOLO con JSON valido`
}

/**
 * Build chat messages for wine analysis
 */
export function buildWineAnalysisMessages(scan: ScanResult): ChatMessage[] {
  return [
    { role: 'system', content: 'Sei un sommelier AI esperto. Rispondi sempre in JSON valido.' },
    { role: 'user', content: buildAnalysisPrompt(scan) },
  ]
}

/**
 * Parse LLM response into WineAnalysis
 */
export function parseWineAnalysis(rawText: string, scan: ScanResult): WineAnalysis {
  let jsonText = rawText.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }

  const parsed = JSON.parse(jsonText)

  return {
    basic: scan,
    evaluation: {
      quality_score: typeof parsed.evaluation?.quality_score === 'number'
        ? Math.max(0, Math.min(100, parsed.evaluation.quality_score))
        : 0,
      style: parsed.evaluation?.style || null,
      aging_potential: parsed.evaluation?.aging_potential || null,
      complexity: parsed.evaluation?.complexity || null,
      summary: parsed.evaluation?.summary || 'Analisi non disponibile.',
    },
    aromatic_profile: {
      intensity: parsed.aromatic_profile?.intensity || null,
      primary_aromas: Array.isArray(parsed.aromatic_profile?.primary_aromas)
        ? parsed.aromatic_profile.primary_aromas
        : [],
      secondary_aromas: Array.isArray(parsed.aromatic_profile?.secondary_aromas)
        ? parsed.aromatic_profile.secondary_aromas
        : null,
      tertiary_aromas: Array.isArray(parsed.aromatic_profile?.tertiary_aromas)
        ? parsed.aromatic_profile.tertiary_aromas
        : null,
    },
    characteristics: {
      body: parsed.characteristics?.body || null,
      tannins: parsed.characteristics?.tannins || null,
      acidity: parsed.characteristics?.acidity || null,
      sweetness: parsed.characteristics?.sweetness || null,
      alcohol: parsed.characteristics?.alcohol || null,
      finish: parsed.characteristics?.finish || null,
    },
    food_pairings: Array.isArray(parsed.food_pairings)
      ? parsed.food_pairings.map((fp: Record<string, unknown>) => ({
          category: String(fp.category || ''),
          dishes: Array.isArray(fp.dishes) ? fp.dishes.map(String) : [],
          match_quality: ['excellent', 'very_good', 'good'].includes(fp.match_quality as string)
            ? fp.match_quality as 'excellent' | 'very_good' | 'good'
            : 'good',
          notes: fp.notes ? String(fp.notes) : undefined,
        }))
      : [],
    guide_ratings: Array.isArray(parsed.guide_ratings)
      ? parsed.guide_ratings.map((gr: Record<string, unknown>) => ({
          guide: String(gr.guide || ''),
          rating: String(gr.rating || ''),
          year: typeof gr.year === 'number' ? gr.year : undefined,
          confidence: typeof gr.confidence === 'number' ? gr.confidence : 0.5,
        }))
      : [],
    user_ratings: Array.isArray(parsed.user_ratings)
      ? parsed.user_ratings.map((ur: Record<string, unknown>) => ({
          platform: String(ur.platform || ''),
          rating: typeof ur.rating === 'number' ? ur.rating : 0,
          review_count: typeof ur.review_count === 'number' ? ur.review_count : undefined,
          confidence: typeof ur.confidence === 'number' ? ur.confidence : 0.5,
        }))
      : [],
    price_info: {
      estimated_range: parsed.price_info?.estimated_range
        ? {
            min: Number(parsed.price_info.estimated_range.min) || 0,
            max: Number(parsed.price_info.estimated_range.max) || 0,
          }
        : null,
      value_rating: parsed.price_info?.value_rating || null,
      market_position: parsed.price_info?.market_position || null,
    },
    confidence: typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5,
  }
}

/**
 * Run full wine analysis: takes ScanResult, returns WineAnalysis
 */
export async function analyzeWine(scan: ScanResult): Promise<WineAnalysis> {
  // Run LLM analysis and image search in parallel
  const [response, imageUrl] = await Promise.all([
    chat(buildWineAnalysisMessages(scan)),
    searchWineImage(scan).catch(() => null), // Don't fail if image search fails
  ])

  const analysis = parseWineAnalysis(response.content, scan)

  // Add image URL if found
  analysis.image_url = imageUrl

  return analysis
}
