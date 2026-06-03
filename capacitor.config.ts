import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.noorarabic.app',
  appName: 'Noor Arabic',
  webDir: 'dist',
  server: {
    // Use https scheme so native WebView accepts cookies/storage
    androidScheme: 'https',
  },
}

export default config
