/**
 * Vision LLM module for wine label recognition
 * Uses Claude Vision API to extract wine information from label images
 */

import type { ScanResult } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

const VISION_MODEL = 'claude-3-5-sonnet-20241022'

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

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Scans a wine label image and extracts wine information
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param mediaType - MIME type of the image (default: image/jpeg)
 * @returns Extracted wine information with confidence score
 */
export async function scanWineLabel(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ScanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured - Vision requires Anthropic API')
  }

  // Remove data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
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
                data: cleanBase64,
              },
            },
            {
              type: 'text',
              text: LABEL_SCAN_PROMPT,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic Vision API error:', errorText)
    throw new Error(`Vision API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.content?.[0]?.text) {
    throw new Error('Invalid Vision API response format')
  }

  const rawText = data.content[0].text.trim()

  try {
    // Try to parse JSON, handling potential markdown wrapping
    let jsonText = rawText
    if (rawText.startsWith('```')) {
      jsonText = rawText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
    }

    const parsed = JSON.parse(jsonText)

    // Validate and normalize the response
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

/**
 * Validates and compresses an image for optimal API usage
 * Returns base64 string and detected media type
 */
export function validateImageData(dataUrl: string): {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  isValid: boolean
  error?: string
} {
  // Check if it's a valid data URL
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
