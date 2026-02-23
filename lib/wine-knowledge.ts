/**
 * Wine Knowledge Generation Module
 *
 * Generates deep sommelier-quality knowledge for wines using LLM.
 * Stores results in the `wine_knowledge` table.
 *
 * Uses:
 * - LLM via lib/llm.ts (chat function)
 * - Supabase Admin via lib/supabase-auth-server.ts (RLS bypass)
 * - Retry pattern from lib/enrichment.ts (chatWithRetry)
 */

import { chat } from './llm'
import { supabaseAdmin } from './supabase-auth-server'
import {
  ENRICHMENT_MAX_RETRIES,
  ENRICHMENT_RETRY_DELAY_MS,
} from '@/config/constants'
import type {
  WineWithRatings,
  WineKnowledge,
  ChatMessage,
  LLMResponse
} from '@/types'

// ============================================
// RETRY LOGIC (from enrichment.ts)
// ============================================

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
      console.error(`[KNOWLEDGE] LLM call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Knowledge generation failed after retries')
}

// ============================================
// PROMPT BUILDER
// ============================================

function buildKnowledgePrompt(wine: WineWithRatings): string {
  // Format ratings for LLM context
  const ratingsText = wine.ratings && wine.ratings.length > 0
    ? wine.ratings.map(r => `- ${r.guide_name}: ${r.score}${r.year ? ` (${r.year})` : ''}`).join('\n')
    : 'Nessuna valutazione disponibile'

  return `Sei un esperto sommelier italiano. Genera informazioni dettagliate e approfondite su questo vino.

VINO:
- Nome: ${wine.name}
${wine.producer ? `- Produttore: ${wine.producer}` : ''}
${wine.region ? `- Regione: ${wine.region}` : ''}
${wine.denomination ? `- Denominazione: ${wine.denomination}` : ''}
${wine.year ? `- Annata: ${wine.year}` : ''}
${wine.grape_varieties?.length ? `- Vitigni: ${wine.grape_varieties.join(', ')}` : ''}
${wine.description ? `- Note: ${wine.description}` : ''}

VALUTAZIONI:
${ratingsText}

RICHIESTA:
Genera un JSON completo con le seguenti informazioni. Sii dettagliato ma conciso.

{
  "producer_history": "2-3 frasi sulla storia della cantina e il suo background",
  "producer_philosophy": "2-3 frasi sulla filosofia produttiva (biodinamico, tradizionale, innovativo, etc.)",
  "terroir_description": "Descrizione del terroir e delle caratteristiche del territorio (1-2 frasi)",
  "vineyard_details": "Dettagli sui vigneti: altitudine, esposizione, età viti (1-2 frasi)",
  "soil_type": "Tipo di suolo (es: calcareo, argilloso, sabbioso, vulcanico)",
  "climate": "Clima della zona (es: continentale, mediterraneo, alpino)",
  "vinification_process": "Processo di vinificazione specifico (2-3 frasi)",
  "aging_method": "Metodo di affinamento (es: barrique francesi, anfore, acciaio)",
  "aging_duration": "Durata dell'affinamento (es: 18 mesi in barrique + 6 in bottiglia)",
  "vintage_notes": "Note sull'annata specifica se disponibile (qualità, condizioni climatiche) (1-2 frasi)",
  "vintage_quality": "eccellente" | "ottima" | "buona" | "media" | "scarsa",
  "food_pairings": [
    {
      "category": "Categoria piatto (es: Primi piatti, Carni rosse, Formaggi)",
      "dishes": ["piatto1", "piatto2", "piatto3"],
      "match": "eccellente" | "ottimo" | "buono",
      "notes": "Note opzionali sull'abbinamento"
    }
  ],
  "serving_temperature": "Temperatura di servizio (es: 16-18°C)",
  "decanting_time": "Tempo di decantazione se necessario (es: 30 minuti, 1 ora, non necessario)",
  "glass_type": "Tipo di bicchiere consigliato (es: Ballon ampio, Tulipano, Flûte)",
  "anecdotes": "Aneddoti o storie interessanti sul vino o sulla cantina (2-3 frasi)",
  "curiosities": [
    "Curiosità 1 (fatto interessante)",
    "Curiosità 2 (fatto interessante)",
    "Curiosità 3 (fatto interessante)"
  ]
}

REGOLE:
- Sii accurato e professionale, basati su conoscenze sommelier reali
- Se un campo non è noto con certezza, lascialo come null
- food_pairings deve avere almeno 3 categorie diverse
- Ogni categoria in food_pairings deve avere almeno 3 piatti
- curiosities deve avere 2-3 elementi (fatti interessanti, non banali)
- vintage_quality: valuta l'annata specifica se nota, altrimenti null
- Tutte le descrizioni in italiano, tono professionale ma accessibile
- Non inventare informazioni: se non sai, usa null

Rispondi SOLO con il JSON, senza altro testo.`
}

// ============================================
// JSON EXTRACTION
// ============================================

function extractJSON(content: string): unknown {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in LLM response')
  }
  return JSON.parse(jsonMatch[0])
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate deep sommelier knowledge for a wine using LLM
 * @param wine Wine with ratings to generate knowledge for
 * @returns Generated WineKnowledge or null on failure
 */
export async function generateWineKnowledge(
  wine: WineWithRatings
): Promise<WineKnowledge | null> {
  console.log(`[KNOWLEDGE] Generating knowledge for wine: ${wine.name} (${wine.id})`)

  try {
    // Build prompt
    const prompt = buildKnowledgePrompt(wine)

    // Call LLM with retry
    const response = await chatWithRetry(
      [
        {
          role: 'system',
          content: 'Sei un esperto sommelier italiano con conoscenza approfondita di vini italiani e internazionali. Rispondi solo in JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      ENRICHMENT_MAX_RETRIES
    )

    // Parse response
    let result: Partial<WineKnowledge>
    try {
      const parsed = extractJSON(response.content)
      result = parsed as Partial<WineKnowledge>
    } catch (parseError) {
      console.error('[KNOWLEDGE] Failed to parse LLM response:', parseError)
      console.error('[KNOWLEDGE] Raw response:', response.content)
      return null
    }

    // Validate required structure
    if (!result || typeof result !== 'object') {
      console.error('[KNOWLEDGE] Invalid response structure')
      return null
    }

    // Upsert into wine_knowledge table
    const { data, error } = await supabaseAdmin
      .from('wine_knowledge')
      .upsert({
        wine_id: wine.id,
        producer_history: result.producer_history || null,
        producer_philosophy: result.producer_philosophy || null,
        terroir_description: result.terroir_description || null,
        vineyard_details: result.vineyard_details || null,
        soil_type: result.soil_type || null,
        climate: result.climate || null,
        vinification_process: result.vinification_process || null,
        aging_method: result.aging_method || null,
        aging_duration: result.aging_duration || null,
        vintage_notes: result.vintage_notes || null,
        vintage_quality: result.vintage_quality || null,
        food_pairings: result.food_pairings || null,
        serving_temperature: result.serving_temperature || null,
        decanting_time: result.decanting_time || null,
        glass_type: result.glass_type || null,
        anecdotes: result.anecdotes || null,
        curiosities: result.curiosities || null,
        knowledge_version: 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wine_id',
      })
      .select()
      .single()

    if (error) {
      console.error('[KNOWLEDGE] Failed to save knowledge to DB:', error)
      return null
    }

    console.log(`[KNOWLEDGE] Successfully generated and saved knowledge for wine: ${wine.name}`)
    return data as WineKnowledge

  } catch (error) {
    console.error('[KNOWLEDGE] Failed to generate knowledge:', error)
    return null
  }
}

/**
 * Get existing wine knowledge from database
 * @param wineId Wine ID
 * @returns WineKnowledge or null if not found
 */
export async function getWineKnowledge(wineId: string): Promise<WineKnowledge | null> {
  const { data, error } = await supabaseAdmin
    .from('wine_knowledge')
    .select('*')
    .eq('wine_id', wineId)
    .single()

  if (error) {
    // PGRST116 = no rows returned (not an error, just no knowledge yet)
    if (error.code !== 'PGRST116') {
      console.error('[KNOWLEDGE] Error fetching wine knowledge:', error)
    }
    return null
  }

  return data as WineKnowledge
}

/**
 * Check if wine has existing knowledge
 * @param wineId Wine ID
 * @returns true if knowledge exists
 */
export async function hasWineKnowledge(wineId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('wine_knowledge')
    .select('id')
    .eq('wine_id', wineId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

/**
 * Trigger knowledge generation asynchronously (fire-and-forget)
 * @param wine Wine to generate knowledge for
 */
export function triggerKnowledgeGenerationAsync(wine: WineWithRatings): void {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  fetch(`${baseUrl}/api/wine-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wine_id: wine.id }),
  }).catch((err) => {
    console.error('[KNOWLEDGE] Failed to trigger knowledge generation:', err)
  })
}

/**
 * Refresh knowledge: delete existing and regenerate
 * @param wine Wine to refresh knowledge for
 * @returns Updated WineKnowledge or null on failure
 */
export async function refreshWineKnowledge(
  wine: WineWithRatings
): Promise<WineKnowledge | null> {
  console.log(`[KNOWLEDGE] Refreshing knowledge for wine: ${wine.name}`)

  // Delete existing knowledge
  const { error } = await supabaseAdmin
    .from('wine_knowledge')
    .delete()
    .eq('wine_id', wine.id)

  if (error) {
    console.error('[KNOWLEDGE] Failed to delete existing knowledge:', error)
  }

  // Generate fresh knowledge
  return generateWineKnowledge(wine)
}
