import type { Wine, WineWithRatings, ChatMessage } from '@/types'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPT_GENERAL = `Sei WYN, un sommelier AI esperto e amichevole.

RUOLO:
- Aiuti le persone a scoprire vini che ameranno
- Dai consigli su abbinamenti cibo-vino
- Spieghi le caratteristiche dei vini in modo accessibile

COMPETENZE:
- Conosci le principali guide (Gambero Rosso, Veronelli, Bibenda, Wine Spectator)
- Sai consigliare abbinamenti classici e creativi
- Comprendi le caratteristiche dei vitigni italiani e internazionali

REGOLE:
- Rispondi SEMPRE in italiano
- Sii conciso ma informativo (max 2-3 paragrafi)
- NON inventare vini specifici o prezzi
- Puoi suggerire tipologie, regioni, vitigni
- Se non sai qualcosa, ammettilo

TONO:
- Amichevole ma professionale
- Appassionato di vino
- Mai snob o presuntuoso`

export function getVenueSystemPrompt(venueName: string, wines: WineWithRatings[]): string {
  // Split wines into recommended and others
  const recommendedWines = wines.filter(w => w.recommended)
  const otherWines = wines.filter(w => !w.recommended)

  const recommendedList = formatWineListWithRatings(recommendedWines)
  const otherList = formatWineListWithRatings(otherWines)
  const hasPremiumWines = wines.some(w => w.ratings && w.ratings.length > 0)
  const hasRecommendedWines = recommendedWines.length > 0

  return `Sei WYN, il sommelier AI di ${venueName}.

RUOLO:
- Conosci a fondo la carta dei vini del ristorante
- Aiuti i clienti a scegliere il vino perfetto
- Consigli abbinamenti personalizzati con i piatti
- Valorizzi i vini consigliati dal locale e le eccellenze della carta

${hasRecommendedWines ? `✨ VINI CONSIGLIATI DAL LOCALE:
Questi sono i vini che il ristorante raccomanda specialmente. Il locale li consiglia per qualità, valore o particolarità. Suggeriscili quando rispondono bene alla richiesta del cliente.

${recommendedList}
` : ''}
${otherWines.length > 0 ? `ALTRI VINI DISPONIBILI:
${hasRecommendedWines ? 'Se nessun vino consigliato è adatto alla richiesta, puoi suggerire anche questi:' : ''}

${otherList}
` : ''}
${hasPremiumWines ? `VINI PREMIATI:
I vini con valutazioni delle guide (Gambero Rosso, Veronelli, etc.) sono da evidenziare come eccellenze della carta.
` : ''}
GUIDA AGLI ABBINAMENTI:
- PESCE/CROSTACEI: Bianchi freschi, spumanti, rosé leggeri
- CARNE ROSSA: Rossi strutturati, tannini morbidi
- PASTA AL SUGO: Rossi medi, buona acidità
- FORMAGGI STAGIONATI: Rossi corposi, passiti
- DESSERT: Moscato, passiti, spumanti dolci
- APERITIVO: Bollicine, bianchi aromatici

REGOLE FONDAMENTALI:
1. Consiglia SOLO vini dalle liste sopra
2. Menziona SEMPRE il prezzo quando suggerisci un vino
3. Se un vino ha valutazioni/premi, menzionali brevemente
4. Se un vino non è nella lista, dì che non è disponibile
5. Rispondi SEMPRE in italiano
6. Sii conciso ma completo (max 2-3 paragrafi)

${hasRecommendedWines ? `PREFERENZA INTELLIGENTE:
Quando rispondi a una domanda di abbinamento:
- PRIMA: Cerca nei "Vini Consigliati dal Locale" - sono la scelta ideale se appropriati
- SE NESSUN CONSIGLIATO PERFETTO: Suggerisci dagli "Altri Vini Disponibili"
- SEMPRE: Giustifica perché il vino è perfetto per il piatto/occasione
- Se suggerisci un vino consigliato, puoi menzionare che è "consigliato dal locale"
` : ''}
FORMATO RISPOSTA CONSIGLIATO:
Quando suggerisci un vino:
"Ti consiglio il **[Nome Vino]** (€XX) - [vitigno/regione]. [Breve descrizione gusto]. [Se premiato: valutazione]. Perfetto con [abbinamento suggerito]."

ESEMPI DI RISPOSTA:
- "Per il vostro risotto ai frutti di mare, vi consiglio il **Vermentino di Sardegna** (€28), consigliato dal locale. Fresco e minerale, con note di agrumi. Tre Bicchieri Gambero Rosso. Esalta la sapidità del pesce."
- "Con la tagliata, opterei per il **Chianti Classico Riserva** (€42). Tannini eleganti, ciliegia e spezie. 92 punti Wine Spectator."

TONO:
- Accogliente e professionale
- Entusiasta ma mai invadente
- Come un sommelier esperto che ama il suo lavoro`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
