// lib/pwa.ts
// PWA utilities for install prompt and app detection

/**
 * BeforeInstallPromptEvent interface
 * Non-standard event fired by browsers when app is installable
 */
export interface BeforeInstallPromptEvent extends Event {
  /**
   * Show the native install prompt
   */
  prompt(): Promise<void>

  /**
   * Promise that resolves with user's choice
   */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Store the deferred install prompt event
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Initialize install prompt listener
 * @param onPromptReady Callback when browser shows install prompt is available
 * @returns Cleanup function to remove event listener
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const cleanup = initInstallPrompt(() => {
 *     setCanInstall(true)
 *   })
 *   return cleanup
 * }, [])
 * ```
 */
export function initInstallPrompt(
  onPromptReady: () => void
): () => void {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (e: Event) => {
    // Prevent default mini-infobar from appearing
    e.preventDefault()

    // Store event for later use
    deferredPrompt = e as BeforeInstallPromptEvent

    // Notify that prompt is ready
    onPromptReady()
  }

  window.addEventListener('beforeinstallprompt', handler)

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handler)
    deferredPrompt = null
  }
}

/**
 * Show the native install prompt
 * @returns Promise<boolean> - true if user accepted, false if dismissed or unavailable
 *
 * @example
 * ```tsx
 * const handleInstall = async () => {
 *   const installed = await showInstallPrompt()
 *   if (installed) {
 *     console.log('App installed!')
 *   }
 * }
 * ```
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('Install prompt not available')
    return false
  }

  try {
    // Show the native install prompt
    await deferredPrompt.prompt()

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice

    // Clear the deferred prompt
    deferredPrompt = null

    return outcome === 'accepted'
  } catch (error) {
    console.error('Error showing install prompt:', error)
    deferredPrompt = null
    return false
  }
}

/**
 * Check if app is already installed (running in standalone mode)
 * @returns boolean - true if running as installed PWA
 *
 * @example
 * ```tsx
 * if (isAppInstalled()) {
 *   // Hide install prompt
 * }
 * ```
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check if running in standalone mode (Android/Chrome, Desktop)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true
  }

  return false
}

/**
 * Check if PWA features are supported in current browser
 * @returns boolean - true if service workers are supported
 */
export function isPWASupported(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return 'serviceWorker' in navigator
}

/**
 * Get install prompt availability status
 * Useful for debugging
 */
export function getInstallPromptStatus(): {
  isAvailable: boolean
  isInstalled: boolean
  isSupported: boolean
} {
  return {
    isAvailable: deferredPrompt !== null,
    isInstalled: isAppInstalled(),
    isSupported: isPWASupported()
  }
}
