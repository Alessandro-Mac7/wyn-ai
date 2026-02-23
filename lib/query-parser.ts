/**
 * Query Intent Parser for WYN
 *
 * Lightweight regex-based parser for Italian wine queries.
 * Extracts structured filters from natural language with zero latency and cost.
 */

export interface ParsedQueryIntent {
  wineType?: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'
  maxPrice?: number
  minPrice?: number
  regionHint?: string
  grapeHint?: string
  foodContext?: string
  isExplorative?: boolean
}

// Wine type patterns
const WINE_TYPE_PATTERNS = {
  red: /\b(rosso|rossi|nero|neri|corposo|corposi|tannico|tannici|strutturato|strutturati)\b/i,
  white: /\b(bianco|bianchi)\b/i,
  // Only match "fresco/freschi" when not preceded by "rosso" (to avoid "rosso fresco")
  whiteFresh: /(?<!rosso\s)\b(fresco|freschi)\b/i,
  rose: /\b(ros[eé]|rosato|rosati)\b/i,
  sparkling: /\b(spumante|spumanti|bollicine|prosecco|champagne|metodo\s+classico|brut|franciacorta)\b/i,
  dessert: /\b(dolce|dolci|passito|moscato\s+dolce|vin\s+santo|vendemmia\s+tardiva)\b/i,
}

// Price extraction patterns
const PRICE_PATTERNS = {
  // "sotto 30 euro", "meno di 30 euro", "massimo 30 euro", "max 30", "entro 30", "fino a 30"
  maxPrice: /\b(?:sotto|meno\s+di|massimo|max|entro|fino\s+a)\s+(\d+)\s*(?:euro|€)?\b/i,
  // "sopra 20 euro", "più di 20 euro", "almeno 20 euro", "minimo 20", "da 20 euro"
  minPrice: /\b(?:sopra|più\s+di|almeno|minimo|da)\s+(\d+)\s*(?:euro|€)?\b/i,
  // "tra 20 e 50 euro", "da 20 a 50 euro"
  range: /\b(?:tra|da)\s+(\d+)\s+(?:e|a)\s+(\d+)\s*(?:euro|€)?\b/i,
}

// Italian wine regions
const REGION_PATTERNS = [
  { pattern: /\b(toscano|toscana)\b/i, value: 'Toscana' },
  { pattern: /\b(piemontese|piemonte)\b/i, value: 'Piemonte' },
  { pattern: /\b(siciliano|sicilia)\b/i, value: 'Sicilia' },
  { pattern: /\b(pugliese|puglia)\b/i, value: 'Puglia' },
  { pattern: /\bveneto\b/i, value: 'Veneto' },
  { pattern: /\b(friulano|friuli)\b/i, value: 'Friuli' },
  { pattern: /\b(campano|campania)\b/i, value: 'Campania' },
  { pattern: /\b(sardo|sardegna)\b/i, value: 'Sardegna' },
  { pattern: /\b(ligure|liguria)\b/i, value: 'Liguria' },
  { pattern: /\b(lombardo|lombardia)\b/i, value: 'Lombardia' },
  { pattern: /\btrentino\b/i, value: 'Trentino' },
  { pattern: /\balto\s+adige\b/i, value: 'Alto Adige' },
  { pattern: /\b(abruzzo|abruzzese)\b/i, value: 'Abruzzo' },
  { pattern: /\b(marche|marchigiano)\b/i, value: 'Marche' },
  { pattern: /\b(umbro|umbria)\b/i, value: 'Umbria' },
  { pattern: /\b(laziale|lazio)\b/i, value: 'Lazio' },
  { pattern: /\b(calabrese|calabria)\b/i, value: 'Calabria' },
  { pattern: /\b(basilicata|lucano)\b/i, value: 'Basilicata' },
  { pattern: /\b(molise|molisano)\b/i, value: 'Molise' },
  { pattern: /\b(valdostano|valle\s+d'aosta)\b/i, value: "Valle d'Aosta" },
  { pattern: /\b(emilia|romagnolo|emilia[-\s]romagna)\b/i, value: 'Emilia-Romagna' },
]

// Italian grape varieties
const GRAPE_PATTERNS = [
  { pattern: /\bnebbiolo\b/i, value: 'Nebbiolo' },
  { pattern: /\bsangiovese\b/i, value: 'Sangiovese' },
  { pattern: /\bbarolo\b/i, value: 'Barolo' },
  { pattern: /\bbarbaresco\b/i, value: 'Barbaresco' },
  { pattern: /\bbrunello\b/i, value: 'Brunello' },
  { pattern: /\bchianti\b/i, value: 'Chianti' },
  { pattern: /\bamarone\b/i, value: 'Amarone' },
  { pattern: /\bprimitivo\b/i, value: 'Primitivo' },
  { pattern: /\bnero\s+d'avola\b/i, value: "Nero d'Avola" },
  { pattern: /\baglianico\b/i, value: 'Aglianico' },
  { pattern: /\bvermentino\b/i, value: 'Vermentino' },
  { pattern: /\btrebbiano\b/i, value: 'Trebbiano' },
  { pattern: /\bpinot\s+grigio\b/i, value: 'Pinot Grigio' },
  { pattern: /\bpinot\s+nero\b/i, value: 'Pinot Nero' },
  { pattern: /\bribolla\s+gialla\b/i, value: 'Ribolla Gialla' },
  { pattern: /\bgarganega\b/i, value: 'Garganega' },
  { pattern: /\bcorvina\b/i, value: 'Corvina' },
  { pattern: /\bfiano\b/i, value: 'Fiano' },
  { pattern: /\bgreco\b/i, value: 'Greco' },
  { pattern: /\bfalanghina\b/i, value: 'Falanghina' },
  { pattern: /\bglera\b/i, value: 'Glera' },
  { pattern: /\bgew[uü]rztraminer\b/i, value: 'Gewürztraminer' },
  { pattern: /\blagrein\b/i, value: 'Lagrein' },
  { pattern: /\bmontepulciano\b/i, value: 'Montepulciano' },
]

// Food context patterns
const FOOD_PATTERNS = [
  { pattern: /\bpesce\b/i, value: 'pesce' },
  { pattern: /\bcrostacei\b/i, value: 'crostacei' },
  { pattern: /\bfrutti\s+di\s+mare\b/i, value: 'frutti di mare' },
  { pattern: /\bcarne\b/i, value: 'carne' },
  { pattern: /\bbistecca\b/i, value: 'bistecca' },
  { pattern: /\bmanzo\b/i, value: 'manzo' },
  { pattern: /\bagnello\b/i, value: 'agnello' },
  { pattern: /\bselvaggina\b/i, value: 'selvaggina' },
  { pattern: /\bpollo\b/i, value: 'pollo' },
  { pattern: /\bpizza\b/i, value: 'pizza' },
  { pattern: /\bpasta\b/i, value: 'pasta' },
  { pattern: /\brisotto\b/i, value: 'risotto' },
  { pattern: /\bformaggi\b/i, value: 'formaggi' },
  { pattern: /\bdessert\b/i, value: 'dessert' },
  { pattern: /\bcioccolato\b/i, value: 'cioccolato' },
  { pattern: /\bantipasto\b/i, value: 'antipasto' },
  { pattern: /\baperitivo\b/i, value: 'aperitivo' },
  { pattern: /\btartare\b/i, value: 'tartare' },
  { pattern: /\bsushi\b/i, value: 'sushi' },
]

// Explorative query patterns
const EXPLORATIVE_PATTERNS = /\b(cosa\s+mi\s+consigli|consigliami|sorprendimi|scegli\s+tu|il\s+migliore|il\s+top)\b/i

/**
 * Parse an Italian natural language wine query into structured filters.
 *
 * @param query - The natural language query in Italian
 * @returns Structured intent with detected filters
 */
export function parseQueryIntent(query: string): ParsedQueryIntent {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim()

  const intent: ParsedQueryIntent = {}

  // 1. Detect wine type
  if (WINE_TYPE_PATTERNS.sparkling.test(normalizedQuery)) {
    intent.wineType = 'sparkling'
  } else if (WINE_TYPE_PATTERNS.dessert.test(normalizedQuery)) {
    intent.wineType = 'dessert'
  } else if (WINE_TYPE_PATTERNS.rose.test(normalizedQuery)) {
    intent.wineType = 'rose'
  } else if (WINE_TYPE_PATTERNS.red.test(normalizedQuery)) {
    intent.wineType = 'red'
  } else if (WINE_TYPE_PATTERNS.white.test(normalizedQuery) || WINE_TYPE_PATTERNS.whiteFresh.test(normalizedQuery)) {
    intent.wineType = 'white'
  }

  // 2. Extract price constraints
  // Check for range first (more specific)
  const rangeMatch = PRICE_PATTERNS.range.exec(normalizedQuery)
  if (rangeMatch) {
    intent.minPrice = parseInt(rangeMatch[1], 10)
    intent.maxPrice = parseInt(rangeMatch[2], 10)
  } else {
    // Check for max price
    const maxMatch = PRICE_PATTERNS.maxPrice.exec(normalizedQuery)
    if (maxMatch) {
      intent.maxPrice = parseInt(maxMatch[1], 10)
    }

    // Check for min price
    const minMatch = PRICE_PATTERNS.minPrice.exec(normalizedQuery)
    if (minMatch) {
      intent.minPrice = parseInt(minMatch[1], 10)
    }
  }

  // 3. Detect region hints
  for (const { pattern, value } of REGION_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      intent.regionHint = value
      break // Take first match
    }
  }

  // 4. Detect grape hints
  for (const { pattern, value } of GRAPE_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      intent.grapeHint = value
      break // Take first match
    }
  }

  // 5. Detect food context
  for (const { pattern, value } of FOOD_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      intent.foodContext = value
      break // Take first match
    }
  }

  // 6. Detect explorative intent
  if (EXPLORATIVE_PATTERNS.test(normalizedQuery)) {
    intent.isExplorative = true
  }

  return intent
}
