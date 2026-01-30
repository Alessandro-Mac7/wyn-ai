import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'wine.wyn.app',
  appName: 'WYN',
  webDir: 'out',
  server: {
    // Production: load from Vercel
    url: 'https://wyn-app.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#171312',
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#171312',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
