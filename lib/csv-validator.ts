import type {
  CsvWineRow,
  ParsedCsvWine,
  CsvValidationError,
  WineCreateInput,
  WineType,
} from '@/types'

const VALID_WINE_TYPES: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert']

// Italian and common aliases for wine types
const WINE_TYPE_ALIASES: Record<string, WineType> = {
  // Italian
  rosso: 'red',
  bianco: 'white',
  rosé: 'rose',
  rosato: 'rose',
  spumante: 'sparkling',
  bollicine: 'sparkling',
  dolce: 'dessert',
  passito: 'dessert',
  // English variations
  red: 'red',
  white: 'white',
  rose: 'rose',
  rosè: 'rose',
  sparkling: 'sparkling',
  dessert: 'dessert',
}

// Wine types that require vintage year
const REQUIRES_YEAR: WineType[] = ['red', 'white', 'rose', 'dessert']

/**
 * Normalize wine type from various inputs to standard WineType
 */
function normalizeWineType(input: string | undefined): WineType | null {
  if (!input) return null

  const normalized = input.toLowerCase().trim()

  // Direct match
  if (VALID_WINE_TYPES.includes(normalized as WineType)) {
    return normalized as WineType
  }

  // Alias match
  return WINE_TYPE_ALIASES[normalized] || null
}

/**
 * Parse grape varieties from comma-separated string
 */
function parseGrapeVarieties(input: string | undefined): string[] | undefined {
  if (!input?.trim()) return undefined

  return input
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

/**
 * Validate a single CSV wine row and return parsed result with errors
 */
export function validateCsvWine(row: CsvWineRow, rowNumber: number): ParsedCsvWine {
  const errors: CsvValidationError[] = []

  // Validate name (required)
  const name = row.name?.trim() || ''
  if (!name) {
    errors.push({ field: 'name', message: 'Il nome è obbligatorio' })
  }

  // Validate wine_type (required)
  const normalizedType = normalizeWineType(row.wine_type)
  if (!normalizedType) {
    errors.push({
      field: 'wine_type',
      message: `Tipo non valido: "${row.wine_type}". Usa: ${VALID_WINE_TYPES.join(', ')}`,
      value: row.wine_type,
    })
  }

  // Validate price (required, positive number)
  const priceStr = row.price?.replace(',', '.').trim() || ''
  const price = parseFloat(priceStr)
  if (isNaN(price) || price <= 0) {
    errors.push({
      field: 'price',
      message: 'Il prezzo deve essere un numero positivo',
      value: row.price,
    })
  }

  // Validate producer (required)
  const producer = row.producer?.trim() || ''
  if (!producer) {
    errors.push({ field: 'producer', message: 'Il produttore è obbligatorio' })
  }

  // Validate year (required for certain wine types)
  const yearStr = row.year?.trim() || ''
  const year = yearStr ? parseInt(yearStr, 10) : undefined
  const requiresYear = normalizedType && REQUIRES_YEAR.includes(normalizedType)

  if (requiresYear && !year) {
    errors.push({
      field: 'year',
      message: `L'annata è obbligatoria per vini ${normalizedType}`,
    })
  }

  if (year !== undefined) {
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      errors.push({
        field: 'year',
        message: `Anno non valido: deve essere tra 1900 e ${currentYear}`,
        value: row.year,
      })
    }
  }

  // Parse optional price_glass
  let priceGlass: number | undefined
  if (row.price_glass?.trim()) {
    const priceGlassStr = row.price_glass.replace(',', '.').trim()
    priceGlass = parseFloat(priceGlassStr)
    if (isNaN(priceGlass) || priceGlass <= 0) {
      errors.push({
        field: 'price_glass',
        message: 'Prezzo calice non valido',
        value: row.price_glass,
      })
      priceGlass = undefined
    }
  }

  // Build WineCreateInput
  const data: WineCreateInput = {
    name,
    wine_type: normalizedType || 'red',
    price: isNaN(price) ? 0 : price,
    producer: producer || undefined,
    year,
    region: row.region?.trim() || undefined,
    denomination: row.denomination?.trim() || undefined,
    grape_varieties: parseGrapeVarieties(row.grape_varieties),
    description: row.description?.trim() || undefined,
    price_glass: priceGlass,
  }

  return {
    rowNumber,
    data,
    errors,
    isValid: errors.length === 0,
  }
}

/**
 * Get the list of required CSV headers
 */
export function getRequiredHeaders(): string[] {
  return ['name', 'wine_type', 'price', 'producer']
}

/**
 * Get the list of optional CSV headers
 */
export function getOptionalHeaders(): string[] {
  return ['year', 'region', 'denomination', 'grape_varieties', 'description', 'price_glass']
}

/**
 * Get all valid CSV headers
 */
export function getAllHeaders(): string[] {
  return [...getRequiredHeaders(), ...getOptionalHeaders()]
}
