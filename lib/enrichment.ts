import { chat } from './llm'
import { supabaseAdmin } from './supabase-auth-server'
import { WINE_GUIDES } from '@/config/wine-guides.config'
import {
  MIN_RATING_CONFIDENCE,
  ENRICHMENT_MAX_RETRIES,
  ENRICHMENT_RETRY_DELAY_MS,
} from '@/config/constants'
import type { Wine, WineWithRatings, ChatMessage, LLMResponse } from '@/types'

// Retry with exponential backoff
async function chatWithRetry(
  messages: ChatMessage[],
  maxRetries: number = ENRICHMENT_MAX_RETRIES
): Promise<LLMResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chat(messages)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on 4xx errors (client errors)
      if (lastError.message.includes('400') ||
          lastError.message.includes('401') ||
          lastError.message.includes('403')) {
        throw lastError
      }

      // Last attempt, throw the error
      if (attempt === maxRetries - 1) {
        break
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = ENRICHMENT_RETRY_DELAY_MS * Math.pow(2, attempt)
      console.error(`Enrichment LLM call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Enrichment failed after retries')
}

interface EnrichmentResult {
  ratings: Array<{
    guide_id: string
    guide_name: string
    score: string
    confidence: number
    year?: number
  }>
  region?: string
  denomination?: string
  grape_varieties?: string[]
  tasting_notes?: string
  suggested_pairings?: string[]
}

function buildEnrichmentPrompt(wine: {
  name: string
  producer?: string
  region?: string
  denomination?: string
  year?: number
  grape_varieties?: string[]
}): string {
  // Build list of missing fields to request
  const missingFields: string[] = []
  if (!wine.region) missingFields.push('region')
  if (!wine.denomination) missingFields.push('denomination')
  if (!wine.grape_varieties?.length) missingFields.push('grape_varieties')

  return `Analizza questo vino italiano e fornisci informazioni dettagliate.

VINO:
- Nome: ${wine.name}
${wine.producer ? `- Produttore: ${wine.producer}` : ''}
${wine.region ? `- Regione: ${wine.region}` : ''}
${wine.denomination ? `- Denominazione: ${wine.denomination}` : ''}
${wine.year ? `- Annata: ${wine.year}` : ''}
${wine.grape_varieties?.length ? `- Vitigni: ${wine.grape_varieties.join(', ')}` : ''}

RICHIESTA:
Fornisci le seguenti informazioni in formato JSON:

{
  "ratings": [
    {
      "guide_id": "gambero-rosso" | "veronelli" | "bibenda" | "wine-spectator" | "robert-parker",
      "guide_name": "Nome guida",
      "score": "punteggio o riconoscimento",
      "confidence": 0.0-1.0,
      "year": anno della valutazione
    }
  ],
  ${missingFields.includes('region') ? '"region": "Regione italiana di produzione",' : ''}
  ${missingFields.includes('denomination') ? '"denomination": "Denominazione (DOC, DOCG, IGT, etc.)",' : ''}
  ${missingFields.includes('grape_varieties') ? '"grape_varieties": ["vitigno1", "vitigno2"],' : ''}
  "tasting_notes": "Note di degustazione in italiano (max 200 caratteri)",
  "suggested_pairings": ["abbinamento1", "abbinamento2", "abbinamento3"]
}

REGOLE:
- Includi SOLO valutazioni che conosci con certezza
- confidence < 0.4 = non sicuro, sarà scartato
- confidence 0.4-0.7 = probabile
- confidence > 0.7 = alta certezza
- Se non conosci valutazioni, ritorna array vuoto
- Tasting notes in italiano, concise
- Per region, denomination e grape_varieties: compila SOLO se non già forniti sopra
- Basati sul nome del vino, produttore e anno per dedurre le informazioni mancanti

Rispondi SOLO con il JSON, senza altro testo.`
}

function isValidGuide(guideId: string): boolean {
  return WINE_GUIDES.some((g) => g.id === guideId)
}

export async function enrichWine(wine: Wine): Promise<WineWithRatings> {
  // Create job record (using admin client for RLS bypass)
  const { data: job, error: jobError } = await supabaseAdmin
    .from('enrichment_jobs')
    .insert({
      wine_id: wine.id,
      status: 'processing',
    })
    .select()
    .single()

  if (jobError) {
    console.error('Failed to create enrichment job:', jobError)
    return { ...wine, ratings: [] }
  }

  try {
    // Build prompt
    const prompt = buildEnrichmentPrompt({
      name: wine.name,
      producer: wine.producer || undefined,
      region: wine.region || undefined,
      denomination: wine.denomination || undefined,
      year: wine.year || undefined,
      grape_varieties: wine.grape_varieties || undefined,
    })

    // Call LLM with retry
    const response = await chatWithRetry([
      {
        role: 'system',
        content: 'Sei un esperto sommelier italiano. Rispondi solo in JSON valido.',
      },
      { role: 'user', content: prompt },
    ])

    // Parse response
    let result: EnrichmentResult
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      result = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse enrichment response:', parseError)
      throw new Error('Invalid LLM response format')
    }

    // Filter ratings by confidence (RULE-006)
    const validRatings = (result.ratings || []).filter(
      (r) => r.confidence >= MIN_RATING_CONFIDENCE && isValidGuide(r.guide_id)
    )

    // Save ratings
    const savedRatings = []
    if (validRatings.length > 0) {
      const ratingsToInsert = validRatings.map((r) => ({
        wine_id: wine.id,
        guide_id: r.guide_id,
        guide_name: r.guide_name,
        score: r.score,
        confidence: r.confidence,
        year: r.year,
      }))

      const { data: insertedRatings, error: ratingsError } = await supabaseAdmin
        .from('wine_ratings')
        .insert(ratingsToInsert)
        .select()

      if (ratingsError) {
        console.error('Failed to save ratings:', ratingsError)
      } else if (insertedRatings) {
        savedRatings.push(...insertedRatings)
      }
    }

    // Update wine with enriched data for missing fields
    const wineUpdates: Record<string, string | string[]> = {}

    if (result.tasting_notes && !wine.description) {
      wineUpdates.description = result.tasting_notes
    }
    if (result.region && !wine.region) {
      wineUpdates.region = result.region
    }
    if (result.denomination && !wine.denomination) {
      wineUpdates.denomination = result.denomination
    }
    if (result.grape_varieties?.length && !wine.grape_varieties?.length) {
      wineUpdates.grape_varieties = result.grape_varieties
    }

    // Apply updates if any
    if (Object.keys(wineUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('wines')
        .update(wineUpdates)
        .eq('id', wine.id)

      if (updateError) {
        console.error('Failed to update wine with enriched data:', updateError)
      }
    }

    // Mark job complete
    await supabaseAdmin
      .from('enrichment_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { ...wine, ratings: savedRatings }
  } catch (error) {
    console.error('Enrichment failed:', error)

    // Mark job failed
    await supabaseAdmin
      .from('enrichment_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', job.id)

    return { ...wine, ratings: [] }
  }
}

// Trigger enrichment without waiting (fire-and-forget)
export function triggerEnrichmentAsync(wine: Wine): void {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  fetch(`${baseUrl}/api/enrichment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wine_id: wine.id }),
  }).catch((err) => {
    console.error('Failed to trigger enrichment:', err)
  })
}

// Refresh enrichment: delete existing ratings and re-enrich
export async function refreshWine(wine: Wine): Promise<WineWithRatings> {
  // Delete existing ratings first (using admin client)
  const { error } = await supabaseAdmin
    .from('wine_ratings')
    .delete()
    .eq('wine_id', wine.id)

  if (error) {
    console.error('Failed to delete existing ratings:', error)
  }

  // Re-run enrichment with fresh data
  return enrichWine(wine)
}
