// ============================================
// WYN - Core Types
// ============================================

export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'

// Re-export user types
export * from './user'

// ============================================
// DATABASE ENTITIES
// ============================================

export interface Venue {
  id: string
  slug: string
  name: string
  description: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export interface VenueWithDistance extends Venue {
  distance: number // Distance in kilometers
}

export interface Wine {
  id: string
  venue_id: string
  name: string
  wine_type: WineType
  price: number
  price_glass: number | null
  producer: string | null
  region: string | null
  denomination: string | null
  grape_varieties: string[] | null
  year: number | null
  description: string | null
  available: boolean
  recommended: boolean
  created_at: string
  updated_at: string
}

export interface WineRating {
  id: string
  wine_id: string
  guide_id: string
  guide_name: string
  score: string
  confidence: number
  year: number | null
  source_url: string | null
  created_at: string
}

export interface WineWithRatings extends Wine {
  ratings: WineRating[]
}

export interface EnrichmentJob {
  id: string
  wine_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  message: string
  venue_slug?: string
  history?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  mode: 'general' | 'venue'
  venue_name?: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  venue: {
    id: string
    slug: string
    name: string
  }
}

export interface WinesResponse {
  wines: WineWithRatings[]
  venue: {
    id: string
    name: string
  }
}

// ============================================
// VENUE INPUT TYPES
// ============================================

export interface VenueCreateInput {
  slug: string
  name: string
  description?: string
  email?: string
  latitude?: number
  longitude?: number
  address?: string
  city?: string
}

export interface VenueUpdateInput extends Partial<VenueCreateInput> {}

// ============================================
// NEARBY VENUES TYPES
// ============================================

export interface NearbyVenuesRequest {
  latitude: number
  longitude: number
  radius?: number // Default 10km
  limit?: number // Default 10
}

export interface NearbyVenuesResponse {
  venues: VenueWithDistance[]
  userLocation: {
    latitude: number
    longitude: number
  }
}

export interface WineCreateInput {
  name: string
  wine_type: WineType
  price: number
  price_glass?: number
  producer?: string
  region?: string
  denomination?: string
  grape_varieties?: string[]
  year?: number
  description?: string
}

export interface WineUpdateInput extends Partial<WineCreateInput> {
  available?: boolean
  recommended?: boolean
}

// ============================================
// LLM TYPES
// ============================================

export interface LLMConfig {
  provider: 'groq' | 'openai' | 'anthropic'
  model: string
  maxTokens: number
  temperature: number
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

// ============================================
// CONFIG TYPES
// ============================================

export interface WineGuide {
  id: string
  name: string
  ratingSystem: string
  philosophy: string
}

// ============================================
// CSV UPLOAD TYPES
// ============================================

export interface CsvWineRow {
  name: string
  wine_type: string
  price: string
  producer: string
  year?: string
  region?: string
  denomination?: string
  grape_varieties?: string
  description?: string
  price_glass?: string
}

export interface CsvValidationError {
  field: string
  message: string
  value?: string
}

export interface ParsedCsvWine {
  rowNumber: number
  data: WineCreateInput
  errors: CsvValidationError[]
  isValid: boolean
}

export interface CsvParseResult {
  wines: ParsedCsvWine[]
  totalRows: number
  validCount: number
  errorCount: number
  headers: string[]
}

export interface BulkImportRequest {
  wines: WineCreateInput[]
}

export interface BulkImportResponse {
  imported: number
  failed: number
  wines: Wine[]
  errors: Array<{
    index: number
    name: string
    error: string
  }>
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  limit?: number
  cursor?: string
  search?: string
  wine_type?: WineType | 'all'
  sortBy?: 'name' | 'price' | 'created_at' | 'wine_type'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationInfo {
  nextCursor: string | null
  hasMore: boolean
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export type WinesPaginatedResponse = PaginatedResponse<WineWithRatings>

// ============================================
// LABEL SCAN TYPES
// ============================================

export interface ScanResult {
  name: string | null
  producer: string | null
  year: number | null
  wine_type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | null
  region: string | null
  denomination: string | null
  grape_varieties: string[] | null
  confidence: number
}

export interface WineMatch<T = Wine> {
  wine: T
  confidence: number
  matchQuality: 'exact' | 'high' | 'partial'
  yearMatches: boolean
}

export interface ScanLabelRequest {
  image: string // Base64 encoded image data URL
  venue_slug?: string // Optional venue for matching
}

export interface ScanLabelResponse {
  success: boolean
  message?: string
  scanned?: ScanResult
  match?: WineMatch<WineWithRatings> | null
  alternatives?: WineMatch<WineWithRatings>[]
}

// ============================================
// WINE ANALYSIS TYPES (Label Scan → Full Analysis)
// ============================================

export interface WineAnalysis {
  basic: ScanResult
  evaluation: {
    quality_score: number
    style: string | null
    aging_potential: string | null
    complexity: string | null
    summary: string
  }
  aromatic_profile: {
    intensity: string | null
    primary_aromas: string[]
    secondary_aromas: string[] | null
    tertiary_aromas: string[] | null
  }
  characteristics: {
    body: string | null
    tannins: string | null
    acidity: string | null
    sweetness: string | null
    alcohol: string | null
    finish: string | null
  }
  food_pairings: FoodPairing[]
  guide_ratings: GuideRating[]
  user_ratings: UserRating[]
  price_info: {
    estimated_range: { min: number; max: number } | null
    value_rating: string | null
    market_position: string | null
  }
  confidence: number
}

export interface FoodPairing {
  category: string
  dishes: string[]
  match_quality: 'excellent' | 'very_good' | 'good'
  notes?: string
}

export interface GuideRating {
  guide: string
  rating: string
  year?: number
  confidence: number
}

export interface UserRating {
  platform: string
  rating: number
  review_count?: number
  confidence: number
}

export interface AnalyzeWineResponse {
  success: boolean
  message?: string
  analysis?: WineAnalysis
}
