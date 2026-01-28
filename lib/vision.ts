/**
 * Vision LLM module for wine label recognition
 * Supports multiple providers: OpenAI (primary), Anthropic, Mock (dev)
 *
 * Priority order:
 * 1. OpenAI GPT-4 Vision (OPENAI_API_KEY)
 * 2. Anthropic Claude Vision (ANTHROPIC_API_KEY)
 * 3. Mock data (development only, no API keys)
 */

import type { ScanResult } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

type VisionProvider = 'openai' | 'anthropic' | 'mock'

const OPENAI_VISION_MODEL = 'gpt-4o-mini' // Cost-effective vision model
const ANTHROPIC_VISION_MODEL = 'claude-3-5-sonnet-20241022'
const ANTHROPIC_VALIDATION_MODEL = 'claude-3-haiku-20240307'

/**
 * Determines which vision provider to use based on available API keys
 * Priority: OpenAI → Anthropic → Mock
 */
function getVisionProvider(): { provider: VisionProvider; apiKey: string | null } {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey }
  }
  if (anthropicKey) {
    return { provider: 'anthropic', apiKey: anthropicKey }
  }
  return { provider: 'mock', apiKey: null }
}

// ============================================
// PROMPTS
// ============================================

const LABEL_SCAN_PROMPT = `Analizza questa foto di un'etichetta di vino italiano.
Estrai le seguenti informazioni in formato JSON:

{
  "name": "Nome completo del vino",
  "producer": "Nome del produttore/cantina",
  "year": 2020,
  "wine_type": "red|white|rose|sparkling|dessert",
  "region": "Regione italiana o paese",
  "denomination": "DOC, DOCG, IGT se visibile",
  "grape_varieties": ["vitigno1", "vitigno2"],
  "confidence": 0.0-1.0
}

REGOLE:
- Se un campo non è visibile/leggibile, usa null
- confidence indica quanto sei sicuro dell'estrazione complessiva
- Per wine_type, deduci dal colore bottiglia/testo se non esplicito:
  - Rosso/Red/Nero → "red"
  - Bianco/White → "white"
  - Rosato/Rosé → "rose"
  - Spumante/Prosecco/Champagne/Metodo Classico → "sparkling"
  - Passito/Vin Santo/Moscato dolce → "dessert"
- Nome vino può includere linea/collezione (es: "Tignanello")
- Per annata/year, cerca numeri a 4 cifre (es: 2019, 2020, 2021)

Rispondi SOLO con JSON valido, senza markdown o altro testo.`

const WINE_VALIDATION_PROMPT = `Analizza questa immagine e determina se contiene:
- Un'etichetta di vino
- Una bottiglia di vino
- Un bicchiere di vino
- Una carta dei vini
- Qualsiasi altro contenuto relativo al vino

Rispondi SOLO con un JSON valido nel formato:
{
  "is_wine_related": true/false,
  "confidence": 0.0-1.0,
  "detected": "label|bottle|glass|menu|other|none"
}

Se l'immagine NON è relativa al vino (es: cibo, persone, paesaggi, altri prodotti),
rispondi con is_wine_related: false.`

// ============================================
// OPENAI VISION
// ============================================

async function scanWithOpenAI(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
  prompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${imageBase64}`,
                detail: 'low', // Use low detail for faster, cheaper processing
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1, // Low temperature for consistent JSON output
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI Vision API error:', response.status, errorText)
    throw new Error(`OpenAI Vision API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============================================
// ANTHROPIC VISION
// ============================================

async function scanWithAnthropic(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
  prompt: string,
  model: string = ANTHROPIC_VISION_MODEL
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic Vision API error:', response.status, errorText)
    throw new Error(`Anthropic Vision API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ============================================
// MAIN SCAN FUNCTION
// ============================================

/**
 * Scans a wine label image and extracts wine information
 * Uses available vision provider (OpenAI → Anthropic → Mock)
 */
export async function scanWineLabel(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ScanResult> {
  const { provider, apiKey } = getVisionProvider()

  // Mock mode for development
  if (provider === 'mock') {
    console.warn('[DEV] No vision API key configured - returning mock wine data')
    return {
      name: 'Brunello di Montalcino',
      producer: 'Biondi-Santi',
      year: 2018,
      wine_type: 'red',
      region: 'Toscana',
      denomination: 'DOCG',
      grape_varieties: ['Sangiovese'],
      confidence: 0.85,
    }
  }

  // Remove data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  console.log(`[VISION] Using ${provider} for label scan`)

  try {
    let rawText: string

    if (provider === 'openai') {
      rawText = await scanWithOpenAI(cleanBase64, mediaType, apiKey!, LABEL_SCAN_PROMPT)
    } else {
      rawText = await scanWithAnthropic(cleanBase64, mediaType, apiKey!, LABEL_SCAN_PROMPT)
    }

    return parseWineLabelResponse(rawText.trim())
  } catch (error) {
    console.error(`[VISION] ${provider} scan failed:`, error)

    // Map errors to user-friendly messages
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('401')) {
      throw new Error('Errore di configurazione del servizio.')
    }
    if (message.includes('429')) {
      throw new Error('Troppe richieste. Riprova tra qualche secondo.')
    }
    if (message.includes('400')) {
      throw new Error('Immagine non valida. Prova con un\'altra foto.')
    }

    throw new Error('Errore nella scansione dell\'etichetta. Riprova.')
  }
}

// ============================================
// WINE IMAGE VALIDATION
// ============================================

export interface WineImageValidation {
  isWineRelated: boolean
  confidence: number
  detected: 'label' | 'bottle' | 'glass' | 'menu' | 'other' | 'none'
  error?: string
}

/**
 * Validates if an image contains wine-related content
 * Uses available vision provider for quick validation
 */
export async function validateWineImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<WineImageValidation> {
  const { provider, apiKey } = getVisionProvider()

  // Mock mode - skip validation
  if (provider === 'mock') {
    console.warn('[DEV] No vision API key - skipping wine image validation')
    return {
      isWineRelated: true,
      confidence: 0.5,
      detected: 'other',
    }
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  console.log(`[VISION] Using ${provider} for image validation`)

  try {
    let rawText: string

    if (provider === 'openai') {
      rawText = await scanWithOpenAI(cleanBase64, mediaType, apiKey!, WINE_VALIDATION_PROMPT)
    } else {
      // Use Haiku for faster/cheaper validation with Anthropic
      rawText = await scanWithAnthropic(
        cleanBase64,
        mediaType,
        apiKey!,
        WINE_VALIDATION_PROMPT,
        ANTHROPIC_VALIDATION_MODEL
      )
    }

    return parseValidationResponse(rawText.trim())
  } catch (error) {
    console.error(`[VISION] ${provider} validation failed:`, error)
    // On error, be permissive but flag it
    return {
      isWineRelated: true,
      confidence: 0.3,
      detected: 'other',
      error: 'Validation failed',
    }
  }
}

// ============================================
// RESPONSE PARSERS
// ============================================

function parseWineLabelResponse(rawText: string): ScanResult {
  try {
    // Handle potential markdown wrapping
    let jsonText = rawText
    if (rawText.startsWith('```')) {
      jsonText = rawText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
    }

    const parsed = JSON.parse(jsonText)

    return {
      name: parsed.name || null,
      producer: parsed.producer || null,
      year: typeof parsed.year === 'number' ? parsed.year : null,
      wine_type: validateWineType(parsed.wine_type),
      region: parsed.region || null,
      denomination: parsed.denomination || null,
      grape_varieties: Array.isArray(parsed.grape_varieties) ? parsed.grape_varieties : null,
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    }
  } catch (parseError) {
    console.error('Failed to parse Vision response:', rawText)
    throw new Error('Failed to parse wine label information')
  }
}

function parseValidationResponse(rawText: string): WineImageValidation {
  try {
    let jsonText = rawText
    if (rawText.startsWith('```')) {
      jsonText = rawText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
    }

    const parsed = JSON.parse(jsonText)

    return {
      isWineRelated: parsed.is_wine_related === true,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      detected: validateDetectedType(parsed.detected),
    }
  } catch {
    return {
      isWineRelated: true,
      confidence: 0.3,
      detected: 'other',
      error: 'Parse failed',
    }
  }
}

// ============================================
// HELPERS
// ============================================

function validateWineType(type: unknown): ScanResult['wine_type'] {
  const validTypes = ['red', 'white', 'rose', 'sparkling', 'dessert']
  if (typeof type === 'string' && validTypes.includes(type)) {
    return type as ScanResult['wine_type']
  }
  return null
}

function validateDetectedType(type: unknown): WineImageValidation['detected'] {
  const validTypes = ['label', 'bottle', 'glass', 'menu', 'other', 'none']
  if (typeof type === 'string' && validTypes.includes(type)) {
    return type as WineImageValidation['detected']
  }
  return 'none'
}

/**
 * Validates and extracts base64 data from a data URL
 */
export function validateImageData(dataUrl: string): {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  isValid: boolean
  error?: string
} {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)

  if (!match) {
    return {
      base64: '',
      mediaType: 'image/jpeg',
      isValid: false,
      error: 'Formato immagine non valido. Usa JPEG, PNG, WebP o GIF.',
    }
  }

  const [, mediaTypeStr, base64] = match
  const mediaType = mediaTypeStr as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  // Check approximate size (base64 is ~33% larger than binary)
  const approximateSizeKB = (base64.length * 3) / 4 / 1024

  if (approximateSizeKB > 5000) {
    return {
      base64: '',
      mediaType,
      isValid: false,
      error: 'Immagine troppo grande. Massimo 5MB.',
    }
  }

  return {
    base64,
    mediaType,
    isValid: true,
  }
}

/**
 * Returns the current vision provider being used
 * Useful for debugging and logging
 */
export function getCurrentVisionProvider(): VisionProvider {
  return getVisionProvider().provider
}
