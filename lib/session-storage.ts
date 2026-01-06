// Session storage configuration

// LocalStorage key for session data
export const SESSION_STORAGE_KEY = 'wyn_session'

// Current session schema version (increment on breaking changes)
export const SESSION_VERSION = 1

// Maximum session age: 4 hours (typical restaurant meal duration)
export const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000

// Maximum messages to persist (prevent localStorage bloat)
export const MAX_PERSISTED_MESSAGES = 50

// Check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Safe localStorage getter with error handling
export function getStorageItem(key: string): string | null {
  if (!isBrowser()) return null

  try {
    return localStorage.getItem(key)
  } catch {
    // Handle localStorage errors (private mode, quota, etc.)
    return null
  }
}

// Safe localStorage setter with error handling
export function setStorageItem(key: string, value: string): boolean {
  if (!isBrowser()) return false

  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // Handle localStorage errors (quota exceeded, etc.)
    console.warn('Failed to save to localStorage:', key)
    return false
  }
}

// Safe localStorage remover with error handling
export function removeStorageItem(key: string): boolean {
  if (!isBrowser()) return false

  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
