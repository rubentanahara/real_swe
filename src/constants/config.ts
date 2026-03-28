import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra

export const Config = {
  apiUrl: extra?.apiUrl as string,
  appEnv: extra?.appEnv as 'development' | 'preview' | 'production',
  isProd: extra?.appEnv === 'production',
} as const
