import type { Wine, WineWithRatings, ChatMessage } from '@/types'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPT_GENERAL = `Sei WYN, un sommelier esperto. Parla come un professionista appassionato: competente, caldo, diretto.

CHI SEI:
- Sommelier con profonda conoscenza dei vini italiani e internazionali
- Conosci le guide (Gambero Rosso, Veronelli, Wine Spectator, etc.) ma non le citi ossessivamente

COME RISPONDERE:
- Dai UNA raccomandazione chiara, non liste di opzioni
- Spiega il perché in modo naturale ("Si sposa bene perché...", "Lo consiglio per...")
- Usa linguaggio sensoriale: parla di profumi, sapori, sensazioni
- Se non hai abbastanza info, chiedi: "Cosa stai mangiando?", "Preferisci vini freschi o strutturati?"

COSA PUOI FARE:
- Consigliare tipologie, vitigni, regioni
- Spiegare abbinamenti cibo-vino
- Parlare di tecniche di degustazione
- Rispondere su enologia in generale

COSA NON PUOI FARE:
- Inventare vini specifici o prezzi (non sei in un locale)
- Rispondere a domande non sul vino → "Sono WYN, il tuo sommelier. Posso aiutarti con il vino e gli abbinamenti."

TONO:
- Naturale e conversazionale
- Competente ma mai snob
- Onesto: se qualcosa non è ideale, dillo
- Conciso: 2-3 frasi per risposte semplici

Rispondi sempre in italiano.`

export function getVenueSystemPrompt(venueName: string, wines: WineWithRatings[]): string {
  // Sort wines by rating and recommendation for better selection
  const sortedWines = sortWinesByRatingAndRecommendation(wines)
  const recommendedWines = wines.filter(w => w.recommended)
  const hasPremiumWines = wines.some(w => w.ratings && w.ratings.length > 0)
  const hasRecommendedWines = recommendedWines.length > 0

  // Build wine list section
  const wineListSection = formatWineListWithRatings(sortedWines)

  return `Sei WYN, il sommelier di ${venueName}. Parla come un vero sommelier: caldo, competente, diretto.

CARTA DEI VINI:
${wineListSection}

${hasPremiumWines ? `VINI PREMIATI: I vini con valutazioni guide (Gambero Rosso, Veronelli, Wine Spectator, etc.) sono eccellenze - menziona il premio solo se rilevante (90+ punti o Tre Bicchieri).
` : ''}
${hasRecommendedWines ? `VINI CONSIGLIATI DAL LOCALE: Suggeriscili solo se adatti alla richiesta specifica.
` : ''}
COME RISPONDERE - Adatta la risposta al tipo di domanda:

1. RICHIESTA ABBINAMENTO ("cosa va bene con X?")
   → DAI UNA SOLA RACCOMANDAZIONE, la migliore
   → Esempio: "Con il branzino ti consiglio il **Vermentino di Gallura** (€32). Fresco e minerale, esalta il pesce. Tre Bicchieri."

2. BUDGET SPECIFICATO ("sotto €25", "economico")
   → UNA sola scelta, la migliore nel budget
   → Esempio: "Nel tuo budget, il **Falanghina** (€22) è perfetto. Fresco, agrumato, ottimo rapporto qualità-prezzo."

3. RICHIESTA OPZIONI ("che alternative ho?", "fammi vedere le opzioni")
   → SOLO IN QUESTO CASO dai 2-3 alternative
   → Descrivi brevemente ciascuna, poi indica la tua preferenza

4. DOMANDA ESPLORATIVA ("che rossi avete?", "cosa mi consigli?")
   → Breve panoramica, poi chiedi cosa stanno mangiando per consigliare meglio

5. FOLLOW-UP ("e qualcosa di più leggero?")
   → Risposta breve, 1-2 frasi massimo

6. CONFRONTO SPECIFICO ("meglio A o B?")
   → Confronto diretto e onesto, poi dai il tuo verdetto

PRIORITÀ DI SELEZIONE:
1. ABBINAMENTO PERFETTO - Il vino deve essere adatto al piatto/occasione
2. QUALITÀ/PREZZO - Miglior valore per il cliente
3. PREMI/VALUTAZIONI - Menzionali se notevoli, ma non sono il fattore principale
4. CONSIGLIATO DAL LOCALE - Solo se davvero pertinente

STILE DI COMUNICAZIONE:
- Parla in modo naturale, come faresti al tavolo
- Una raccomandazione sicura vale più di tre opzioni confuse
- Usa linguaggio sensoriale: "Note di agrumi e mare", "Tannini setosi"
- Sii onesto: se un vino non è ideale, dillo
- Menziona il prezzo sempre, ma naturalmente nel discorso
- Se non sai qualcosa, chiedi ("Cosa state mangiando?", "Preferite vini più freschi o strutturati?")

ESEMPI DI RISPOSTE NATURALI:

Richiesta: "Vino per il pesce"
✓ "Per il pesce vi consiglio il **Vermentino di Sardegna** (€28). Sapido e minerale, con note di agrumi che si sposano perfettamente. Tre Bicchieri Gambero Rosso."

Richiesta: "Rosso sotto €30"
✓ "Il **Montepulciano d'Abruzzo** (€24) è la scelta giusta. Corposo, fruttato, ottimo valore. Cosa state mangiando? Così vedo se è l'abbinamento giusto."

Richiesta: "Non so cosa scegliere"
✓ "Cosa avete ordinato? Così vi consiglio il vino perfetto."

Richiesta: "Che bollicine avete?"
✓ "Abbiamo il **Franciacorta Brut** (€45) - elegante, fine perlage - e il **Prosecco Valdobbiadene** (€28) - fresco e versatile. Per un'occasione speciale, il Franciacorta. Per l'aperitivo, il Prosecco è perfetto."

REGOLE INVIOLABILI:
- SOLO vini dalla carta - MAI inventare
- Menziona sempre il prezzo
- Rispondi in italiano
- MAI mostrare ragionamento interno o vini scartati
- Se fuori tema: "Sono il sommelier di ${venueName}, posso aiutarti con la scelta del vino."

TONO: Come un sommelier esperto che ama il suo lavoro - competente, caldo, mai snob.`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sort wines by rating score and recommendation status
 * Priority: 1) High ratings, 2) Venue recommended, 3) Price (higher = premium)
 */
function sortWinesByRatingAndRecommendation(wines: WineWithRatings[]): WineWithRatings[] {
  return [...wines].sort((a, b) => {
    // Priority 1: High-confidence ratings (higher score first)
    const aMaxRating = getMaxNormalizedRatingScore(a)
    const bMaxRating = getMaxNormalizedRatingScore(b)
    if (aMaxRating !== bMaxRating) return bMaxRating - aMaxRating

    // Priority 2: Venue recommended
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1

    // Priority 3: Price (higher = premium position)
    return b.price - a.price
  })
}

/**
 * Get the highest normalized rating score for a wine (0-100 scale)
 * Handles multiple rating systems from different guides
 */
function getMaxNormalizedRatingScore(wine: WineWithRatings): number {
  if (!wine.ratings?.length) return 0
  const validRatings = wine.ratings.filter(r => r.confidence >= 0.7)
  if (!validRatings.length) return 0

  // Normalize different rating systems to 0-100 scale
  const normalizedScores = validRatings.map(r => {
    const score = parseFloat(String(r.score))
    if (isNaN(score)) return 0

    const guideName = r.guide_name?.toLowerCase() || ''

    // Jancis Robinson: 0-20 scale → 0-100
    // 20/20 = 100, 18/20 = 90, 16/20 = 80, etc.
    if (guideName.includes('jancis') || guideName.includes('robinson')) {
      if (score >= 0 && score <= 20) return score * 5
    }

    // Wine Spectator, Robert Parker, James Suckling, DoctorWine, Decanter, Vinous, Wine Enthusiast
    // Already on 50-100 scale
    if (score >= 50 && score <= 100) return score

    // Gambero Rosso Tre Bicchieri: 1-3 → 80-100
    // 3 bicchieri = 100, 2 bicchieri = 90, 1 bicchiere = 80
    if (guideName.includes('gambero') || guideName.includes('bicchieri')) {
      if (score >= 1 && score <= 3) return 70 + (score * 10)
    }

    // Veronelli: Stars 1-3 + Soli 1-3
    // Assume combined or just stars: 1-3 → 80-100
    if (guideName.includes('veronelli')) {
      if (score >= 1 && score <= 3) return 70 + (score * 10)
      if (score >= 1 && score <= 6) return 65 + (score * 5.8) // Combined stars+soli
    }

    // Bibenda Grappoli: 1-5 → 60-100
    // 5 grappoli = 100, 4 = 92, 3 = 84, 2 = 76, 1 = 68
    if (guideName.includes('bibenda') || guideName.includes('grappol')) {
      if (score >= 1 && score <= 5) return 60 + (score * 8)
    }

    // Generic fallback for small scales (1-5 or 1-3)
    if (score >= 1 && score <= 5) return 60 + (score * 8)
    if (score >= 1 && score <= 3) return 70 + (score * 10)

    return score
  })

  return Math.max(...normalizedScores, 0)
}

export function formatWineListForPrompt(wines: Wine[]): string {
  if (wines.length === 0) {
    return 'Nessun vino disponibile al momento.'
  }

  const grouped = groupWinesByType(wines)

  let result = ''
  for (const [type, typeWines] of Object.entries(grouped)) {
    const typeLabel = getTypeLabel(type as Wine['wine_type'])
    result += `\n### ${typeLabel}\n`

    for (const wine of typeWines) {
      result += formatWineForPrompt(wine)
    }
  }

  return result.trim()
}

export function formatWineListWithRatings(wines: WineWithRatings[]): string {
  if (wines.length === 0) {
    return 'Nessun vino disponibile al momento.'
  }

  const grouped = groupWinesByTypeWithRatings(wines)

  let result = ''
  for (const [type, typeWines] of Object.entries(grouped)) {
    const typeLabel = getTypeLabel(type as Wine['wine_type'])
    result += `\n### ${typeLabel}\n`

    for (const wine of typeWines) {
      result += formatWineWithRatingsForPrompt(wine)
    }
  }

  return result.trim()
}

function formatWineForPrompt(wine: Wine): string {
  const parts: string[] = []

  // Name and year
  let nameLine = `- **${wine.name}**`
  if (wine.year) {
    nameLine += ` (${wine.year})`
  }
  parts.push(nameLine)

  // Price
  let priceLine = ` - €${wine.price}/bottiglia`
  if (wine.price_glass) {
    priceLine += `, €${wine.price_glass}/calice`
  }
  parts.push(priceLine)

  // Details
  const details: string[] = []
  if (wine.producer) details.push(wine.producer)
  if (wine.region) details.push(wine.region)
  if (wine.grape_varieties?.length) {
    details.push(wine.grape_varieties.join(', '))
  }

  if (details.length > 0) {
    parts.push(`\n  ${details.join(' | ')}`)
  }

  // Description
  if (wine.description) {
    parts.push(`\n  ${wine.description}`)
  }

  return parts.join('') + '\n'
}

function formatWineWithRatingsForPrompt(wine: WineWithRatings): string {
  const parts: string[] = []

  // Name and year
  let nameLine = `- **${wine.name}**`
  if (wine.year) {
    nameLine += ` (${wine.year})`
  }
  parts.push(nameLine)

  // Price
  let priceLine = ` - €${wine.price}/bottiglia`
  if (wine.price_glass) {
    priceLine += `, €${wine.price_glass}/calice`
  }
  parts.push(priceLine)

  // Details
  const details: string[] = []
  if (wine.producer) details.push(wine.producer)
  if (wine.region) details.push(wine.region)
  if (wine.grape_varieties?.length) {
    details.push(wine.grape_varieties.join(', '))
  }

  if (details.length > 0) {
    parts.push(`\n  ${details.join(' | ')}`)
  }

  // Ratings (if available)
  if (wine.ratings && wine.ratings.length > 0) {
    const ratingsText = wine.ratings
      .filter(r => r.confidence >= 0.7) // Only show high-confidence ratings
      .map(r => `${r.guide_name}: ${r.score}`)
      .join(', ')

    if (ratingsText) {
      parts.push(`\n  ⭐ ${ratingsText}`)
    }
  }

  // Description
  if (wine.description) {
    parts.push(`\n  ${wine.description}`)
  }

  return parts.join('') + '\n'
}

function groupWinesByType(wines: Wine[]): Record<string, Wine[]> {
  return wines.reduce((acc, wine) => {
    const type = wine.wine_type
    if (!acc[type]) acc[type] = []
    acc[type].push(wine)
    return acc
  }, {} as Record<string, Wine[]>)
}

function groupWinesByTypeWithRatings(wines: WineWithRatings[]): Record<string, WineWithRatings[]> {
  return wines.reduce((acc, wine) => {
    const type = wine.wine_type
    if (!acc[type]) acc[type] = []
    acc[type].push(wine)
    return acc
  }, {} as Record<string, WineWithRatings[]>)
}

function getTypeLabel(type: Wine['wine_type']): string {
  const labels: Record<Wine['wine_type'], string> = {
    red: 'Vini Rossi',
    white: 'Vini Bianchi',
    rose: 'Vini Rosé',
    sparkling: 'Spumanti',
    dessert: 'Vini da Dessert',
  }
  return labels[type]
}

// ============================================
// MESSAGE BUILDERS
// ============================================

export function buildChatMessages(
  userMessage: string,
  systemPrompt: string,
  history: ChatMessage[] = []
): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]
}

// ============================================
// QUICK SUGGESTIONS
// ============================================

export const GENERAL_SUGGESTIONS = [
  'Rosso per la carne',
  'Vini sotto 30€',
  'Bollicine aperitivo',
]

export const VENUE_SUGGESTIONS = [
  'Cosa mi consigli con il pesce?',
  'Un rosso corposo',
  'Bollicine per festeggiare',
]
