// ============================================
// lib/haptics.ts
// Haptic feedback for native-like feel
// ============================================

export const haptic = {
  /**
   * Light tap feedback
   */
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },

  /**
   * Medium feedback for button presses
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15)
    }
  },

  /**
   * Success pattern
   */
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  },

  /**
   * Error/warning pattern
   */
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30])
    }
  },
}
