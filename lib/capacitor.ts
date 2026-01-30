import { Capacitor } from '@capacitor/core'

/**
 * Returns true if the app is running inside a native Capacitor shell.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Trigger a light haptic feedback. No-op on web.
 */
export async function triggerHaptic(): Promise<void> {
  if (!isNativeApp()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  await Haptics.impact({ style: ImpactStyle.Light })
}

/**
 * Register for push notifications. No-op on web.
 * Returns the FCM/APNs token if available.
 */
export async function initPushNotifications(): Promise<string | null> {
  if (!isNativeApp()) return null

  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return null

  await PushNotifications.register()

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value)
    })

    PushNotifications.addListener('registrationError', () => {
      resolve(null)
    })
  })
}
