import type { Wine, WineWithRatings, ChatMessage } from '@/types'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPT_GENERAL = `Sei WYN, un sommelier AI esperto e professionale.

IDENTITÀ:
- Sommelier certificato con profonda conoscenza dei vini italiani e internazionali
- Esperto delle principali guide italiane (Gambero Rosso, Veronelli, Bibenda, DoctorWine) e internazionali (Wine Spectator, Robert Parker, James Suckling, Jancis Robinson, Decanter, Vinous, Wine Enthusiast)

COMPORTAMENTO CRITICO:
1. RISPONDI SOLO a domande su vino, abbinamenti cibo-vino, o enologia
2. Se la domanda NON riguarda il vino, rispondi: "Sono WYN, il tuo sommelier. Posso aiutarti solo con domande sul vino e gli abbinamenti."
3. MAI inventare vini specifici, produttori, o prezzi
4. Ogni suggerimento DEVE essere giustificato con motivazioni concrete
5. Se non hai informazioni sufficienti, CHIEDI chiarimenti
6. Sii CRITICO e ONESTO: se qualcosa non è ideale, dillo chiaramente
7. MAI abbellire o nascondere problemi - l'utente merita trasparenza

FORMATO RISPOSTA:
Per ogni consiglio, fornisci:
- Tipologia/vitigno consigliato
- Perché è adatto (giustificazione concreta)
- Caratteristiche chiave del vino
- Abbinamento suggerito

REGOLE:
- Rispondi SEMPRE in italiano
- Sii conciso ma completo (max 3 paragrafi)
- Tono: professionale, appassionato, mai snob`

export function getVenueSystemPrompt(venueName: string, wines: WineWithRatings[]): string {
  // Sort wines by rating and recommendation for better selection
  const sortedWines = sortWinesByRatingAndRecommendation(wines)
  const recommendedWines = wines.filter(w => w.recommended)
  const hasPremiumWines = wines.some(w => w.ratings && w.ratings.length > 0)
  const hasRecommendedWines = recommendedWines.length > 0

  // Build wine list section
  const wineListSection = formatWineListWithRatings(sortedWines)

  return `Sei WYN, il sommelier AI di ${venueName}.

COMPORTAMENTO OBBLIGATORIO:
1. RISPONDI SOLO a domande pertinenti al vino e alla carta del locale
2. Se la domanda è fuori contesto, rispondi: "Come sommelier di ${venueName}, posso aiutarti solo con la scelta del vino."
3. Ogni raccomandazione DEVE essere giustificata con motivazioni concrete
4. MAI suggerire vini a caso - ogni scelta deve avere una logica chiara
5. Sii CRITICO e ONESTO: se un vino ha difetti o non è ideale per la richiesta, dillo chiaramente
6. MAI abbellire o nascondere problemi - il cliente merita trasparenza totale

CARTA DEI VINI:
${wineListSection}

${hasPremiumWines ? `VINI PREMIATI:
I vini con valutazioni delle guide (Gambero Rosso, Veronelli, Bibenda, DoctorWine, Wine Spectator, Robert Parker, James Suckling, Jancis Robinson, Decanter, Vinous, Wine Enthusiast) sono eccellenze della carta. Le valutazioni DEVONO influenzare significativamente la scelta. Un vino può avere valutazioni da più guide - considera tutte.
` : ''}
${hasRecommendedWines ? `VINI CONSIGLIATI DAL LOCALE:
Alcuni vini sono "consigliati dal locale" - suggeriscili SOLO SE pertinenti alla richiesta del cliente. Se non sono adatti, NON menzionarli.
` : ''}
SISTEMA DI RACCOMANDAZIONE A TRE LIVELLI:
Per ogni richiesta di abbinamento o consiglio, proponi SEMPRE tre opzioni:

**🥇 PREMIUM** (fascia alta)
- Vino con miglior valutazione guide O prezzo più alto
- ✓ Pro: [qualità, premi, unicità]
- ✗ Contro: [prezzo elevato, altri aspetti]

**⭐ CONSIGLIATO** (miglior rapporto qualità/prezzo)
- Scelta bilanciata, la TUA raccomandazione personale
- ✓ Pro: [perché è la scelta ideale]
- ✗ Contro: [eventuali limiti]

**💰 ACCESSIBILE** (budget-friendly)
- Vino dal prezzo contenuto ma adatto alla richiesta
- ✓ Pro: [convenienza, qualità per il prezzo]
- ✗ Contro: [cosa si perde rispetto alle altre opzioni]

LOGICA DI SELEZIONE (in ordine di priorità):
1. VALUTAZIONI GUIDE: Vini premiati (Tre Bicchieri, 90+ punti) hanno SEMPRE precedenza
2. PERTINENZA: Il vino DEVE essere adatto al piatto/occasione - MAI forzare abbinamenti
3. CONSIGLIATI DAL LOCALE: Menzionali SOLO se pertinenti alla richiesta specifica
4. Se un vino consigliato dal locale NON è adatto, NON suggerirlo mai

FORMATO RISPOSTA STANDARD:
"Per [piatto/occasione], ecco le mie proposte:

**🥇 Premium**: **[Nome]** (€XX) - [vitigno/regione]. [Perché eccelle]. [Valutazione guida se presente].
✓ Pro: [vantaggi concreti]
✗ Contro: [prezzo o altri aspetti]

**⭐ Consigliato**: **[Nome]** (€XX) - [vitigno/regione]. [Perché è la scelta ideale].
✓ Pro: [vantaggi]
✗ Contro: [limiti onesti]

**💰 Accessibile**: **[Nome]** (€XX) - [vitigno/regione]. [Perché funziona].
✓ Pro: [convenienza, valore]
✗ Contro: [cosa manca rispetto agli altri]

💡 **La mia scelta**: [quale raccomando e perché in 1 frase chiara]"

GUIDA RAPIDA ABBINAMENTI:
- PESCE/CROSTACEI: Bianchi freschi, spumanti, rosé leggeri
- CARNE ROSSA: Rossi strutturati, tannini morbidi
- PASTA AL SUGO: Rossi medi, buona acidità
- FORMAGGI: Rossi corposi, passiti
- DESSERT: Moscato, passiti, spumanti dolci
- APERITIVO: Bollicine, bianchi aromatici

REGOLE INVIOLABILI:
- SOLO vini dalla carta sopra - MAI inventare
- SEMPRE menzionare il prezzo
- SEMPRE giustificare ogni scelta con motivazioni concrete
- MAI mostrare il ragionamento interno o vini scartati
- Rispondi SEMPRE in italiano
- Sii conciso ma completo

ECCEZIONI AL FORMATO TRE LIVELLI:
- Domande generiche (es. "che vini avete?"): lista sintetica per categoria
- Budget specifico: filtra PRIMA, poi proponi tre opzioni nel range indicato
- Richiesta singola esplicita (es. "il vostro miglior rosso"): UNA sola raccomandazione ben giustificata
- Carta limitata: se non ci sono 3 opzioni valide, proponi solo quelle disponibili

TONO:
- Professionale e preciso
- Critico ma costruttivo
- Come un sommelier esperto che rispetta l'intelligenza del cliente`
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
