import { NextRequest, NextResponse } from 'next/server'
import { validateImageData, validateWineImage, scanWineLabel } from '@/lib/vision'
import { analyzeWine } from '@/lib/wine-analysis'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import type { AnalyzeWineResponse } from '@/types'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request.headers)
  const rateLimit = checkRateLimit(`analyze-wine:${clientId}`, RATE_LIMITS.analyzeWine)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra qualche secondo.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetIn),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetIn),
        },
      }
    )
  }

  try {
    const body = await request.json()

    if (!body.image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Validate image data
    const imageValidation = validateImageData(body.image)
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error || 'Invalid image data' },
        { status: 400 }
      )
    }

    // Validate wine content
    const wineValidation = await validateWineImage(
      imageValidation.base64,
      imageValidation.mediaType
    )

    if (!wineValidation.isWineRelated && wineValidation.confidence > 0.7) {
      return NextResponse.json(
        {
          error: 'Questa immagine non sembra contenere un\'etichetta di vino. Per favore scatta o carica una foto di un\'etichetta, bottiglia o carta dei vini.',
        },
        { status: 400 }
      )
    }

    // Step 1: OCR extraction
    const scanResult = await scanWineLabel(body.image)

    if (scanResult.confidence < 0.3) {
      const response: AnalyzeWineResponse = {
        success: false,
        message: 'Non riesco a leggere bene l\'etichetta. Prova con più luce e inquadra meglio.',
      }
      return NextResponse.json(response)
    }

    // Step 2: Full analysis via LLM
    const analysis = await analyzeWine(scanResult)

    const response: AnalyzeWineResponse = {
      success: true,
      analysis,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analyze Wine API Error:', error)
    return NextResponse.json(
      { error: 'Errore nell\'analisi del vino. Riprova.' },
      { status: 500 }
    )
  }
}
