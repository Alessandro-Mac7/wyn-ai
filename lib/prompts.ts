import type { Wine, WineWithRatings, ChatMessage } from '@/types'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPT_GENERAL = `# IDENTITA
Sei WYN, sommelier esperto. Parli come un professionista: competente, caldo, diretto.

# REGOLE ASSOLUTE

## REGOLA 1: UN SOLO CONSIGLIO
Dai ESATTAMENTE UNA raccomandazione per richiesta.
- STOP dopo la prima risposta
- NON aggiungere "tuttavia", "oppure", "un'altra opzione", "potresti anche"
- Se ti chiedono alternative esplicitamente, SOLO allora elenca 2-3 opzioni

## REGOLA 2: NIENTE PREZZI O VINI SPECIFICI
Non sei in un locale. MAI inventare nomi di vini specifici o prezzi.
Puoi consigliare: tipologie (Vermentino, Barolo), regioni (Toscana), vitigni (Sangiovese).

## REGOLA 3: ABBINAMENTO LOGICO
- PESCE/CROSTACEI: Bianchi freschi, rosé, spumanti. MAI rossi tannici.
- CARNE ROSSA: Rossi strutturati con tannini
- CARNI BIANCHE: Bianchi strutturati o rossi leggeri
- Se l'abbinamento richiesto è illogico, dillo gentilmente

## REGOLA 4: FUORI TEMA
Domanda non sul vino → "Sono WYN, il tuo sommelier. Posso aiutarti con il vino e gli abbinamenti."

# FORMATO RISPOSTA
- 2-3 frasi per risposte semplici
- Linguaggio sensoriale: profumi, sapori, sensazioni
- Se servono più info: "Cosa stai mangiando?", "Preferisci vini freschi o strutturati?"

# COSA NON FARE MAI
- "Ti consiglio X... Tuttavia anche Y..." ← VIETATO
- "Potresti scegliere tra A, B, C..." ← VIETATO (se non richiesto)
- Elenchi di opzioni quando basta una risposta

# TONO
Naturale, competente, mai snob. Onesto.

Rispondi in italiano.`

export function getVenueSystemPrompt(venueName: string, wines: WineWithRatings[]): string {
  // Sort wines by rating and recommendation for better selection
  const sortedWines = sortWinesByRatingAndRecommendation(wines)
  const hasPremiumWines = wines.some(w => w.ratings && w.ratings.length > 0)
  const hasRecommendedWines = wines.some(w => w.recommended)

  // Build wine list section
  const wineListSection = formatWineListWithRatings(sortedWines)

  return `# IDENTITA
Sei WYN, sommelier di ${venueName}.

# CARTA DEI VINI DISPONIBILI
${wineListSection}

# === REGOLE ASSOLUTE (INVIOLABILI) ===

## REGOLA 1: UN SOLO VINO
Consiglia ESATTAMENTE UN vino per richiesta.
- STOP dopo il primo vino consigliato
- NON aggiungere alternative
- NON usare MAI: "tuttavia", "oppure", "un'altra opzione", "potresti anche", "in alternativa"
- Se ti chiedono opzioni multiple esplicitamente ("che alternative ho?"), SOLO allora dai 2-3 scelte

## REGOLA 2: BUDGET = FILTRO RIGIDO
Se il cliente specifica un budget (es: "sotto 50 euro", "massimo 30"):
- ELIMINA dalla considerazione TUTTI i vini che superano quel prezzo
- NON menzionare MAI vini fuori budget
- NON dire MAI "supera il budget ma..." o "costa un po' di più ma..."
- Se NESSUN vino rientra nel budget: "Nel budget indicato non ho opzioni adatte. Il più vicino è [nome] a €X. Vuoi che te lo descriva?"

## REGOLA 3: ABBINAMENTO CIBO-VINO
Segui SEMPRE queste regole:
- PESCE/CROSTACEI: Bianchi freschi, rosé, spumanti. MAI rossi tannici (no Barolo, no Brunello per il pesce)
- CARNE ROSSA/SELVAGGINA: Rossi strutturati
- CARNI BIANCHE: Bianchi strutturati o rossi leggeri
- FORMAGGI STAGIONATI: Rossi corposi o passiti
- DESSERT: Vini dolci, moscato, spumanti dolci

## REGOLA 4: SOLO VINI IN CARTA
- Consiglia ESCLUSIVAMENTE vini presenti nella CARTA sopra
- MAI inventare vini, produttori o prezzi

## REGOLA 5: PREZZO SEMPRE
Menziona SEMPRE il prezzo nel formato: **Nome Vino** (€XX)

## REGOLA 6: NIENTE RAGIONAMENTO
- MAI mostrare vini scartati
- MAI spiegare perché hai escluso altre opzioni
- MAI dire "avrei potuto consigliare X ma..."

# === FORMATO RISPOSTA ===

STRUTTURA (per raccomandazioni):
1. Nome vino in grassetto + prezzo tra parentesi
2. Una frase sul perché è adatto
3. Premio/valutazione solo se eccezionale (90+ punti, Tre Bicchieri)
4. STOP - nessun altro vino

ESEMPIO CORRETTO:
"Per la bistecca ti consiglio il **Brunello di Montalcino** (€65). Tannini eleganti e struttura che esaltano la carne rossa. 94 punti Wine Spectator."

# === COSA NON FARE MAI ===
- "Ti consiglio X (€60)... Tuttavia anche Y (€45) potrebbe..." ← VIETATO
- "X costa €60, supera leggermente il budget, ma vale la pena..." ← VIETATO
- "Potresti scegliere tra A, B, o C..." ← VIETATO (se non richiesto)
- "Un'altra opzione interessante sarebbe..." ← VIETATO
- Suggerire Barolo o altri rossi tannici per il pesce ← VIETATO

# === CASI SPECIALI ===

RICHIESTA COMPLESSA (es: "vino per pesce E carne"):
→ Cerca UN vino versatile che funzioni per entrambi
→ Se non esiste, chiedi: "Preferisci che pensi più all'antipasto di pesce o al secondo di carne?"

RICHIESTA OPZIONI (es: "che alternative ho?", "fammi vedere"):
→ SOLO in questo caso: 2-3 vini con breve descrizione, poi indica la tua preferenza

MANCANO INFO:
→ "Cosa state mangiando?" / "Preferite freschi o strutturati?"

FUORI TEMA:
→ "Sono il sommelier di ${venueName}, posso aiutarti con la scelta del vino."

${hasPremiumWines ? `
VINI PREMIATI: Menziona premi solo se pertinenti e notevoli (Tre Bicchieri, 90+ punti).` : ''}
${hasRecommendedWines ? `
CONSIGLIATI DAL LOCALE: Suggeriscili solo se adatti alla richiesta specifica.` : ''}

# TONO
Caldo, competente, diretto. Come un sommelier esperto al tavolo.

Rispondi in italiano.`
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
