import type { ExpoConfig } from 'expo/config'

const IS_PROD = process.env.APP_ENV === 'production'
const IS_PREVIEW = process.env.APP_ENV === 'preview'

const getAppId = () => {
  if (IS_PROD) return 'com.sylowdev.realswe'
  if (IS_PREVIEW) return 'com.sylowdev.realswe.preview'
  return 'com.sylowdev.realswe.dev'
}

const config: ExpoConfig = {
  name: IS_PROD ? 'Real SWE' : IS_PREVIEW ? 'Real SWE (Preview)' : 'Real SWE (Dev)',
  slug: 'real-swe',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'realswe',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: getAppId(),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#000',
    },
    package: getAppId(),
  },
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3000',
    appEnv: process.env.APP_ENV ?? 'development',
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
  plugins: ['expo-router', 'expo-font', 'expo-secure-store'],
}

export default config
