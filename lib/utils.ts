import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { WineType } from '@/types'

// ============================================
// TAILWIND UTILITIES
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatWineType(type: WineType): string {
  const labels: Record<WineType, string> = {
    red: 'Rosso',
    white: 'Bianco',
    rose: 'Rosé',
    sparkling: 'Spumante',
    dessert: 'Dessert',
  }
  return labels[type] || type
}

export function formatWineTypeForBadge(type: WineType): {
  label: string
  className: string
} {
  const config: Record<WineType, { label: string; className: string }> = {
    red: { label: 'Rosso', className: 'bg-red-900 text-red-100' },
    white: { label: 'Bianco', className: 'bg-amber-800 text-amber-100' },
    rose: { label: 'Rosé', className: 'bg-pink-900 text-pink-100' },
    sparkling: { label: 'Spumante', className: 'bg-purple-900 text-purple-100' },
    dessert: { label: 'Dessert', className: 'bg-orange-900 text-orange-100' },
  }
  return config[type] || { label: type, className: 'bg-gray-700 text-gray-100' }
}

// ============================================
// STRING UTILITIES
// ============================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trimEnd() + '...'
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// ============================================
// ARRAY UTILITIES
// ============================================

export function parseGrapeVarieties(input: string): string[] {
  if (!input?.trim()) return []
  return input
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

export function joinGrapeVarieties(varieties: string[] | null): string {
  if (!varieties?.length) return ''
  return varieties.join(', ')
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPrice(price: unknown): price is number {
  return typeof price === 'number' && price >= 0 && isFinite(price)
}

export function isValidYear(year: unknown): year is number {
  if (typeof year !== 'number') return false
  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear + 1
}

// ============================================
// DATE UTILITIES
// ============================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Adesso'
  if (diffMins < 60) return `${diffMins} min fa`
  if (diffHours < 24) return `${diffHours} ore fa`
  if (diffDays < 7) return `${diffDays} giorni fa`
  return formatDate(dateString)
}
