import * as SecureStore from 'expo-secure-store'

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const

export const secureStorage = {
  getToken: () => SecureStore.getItemAsync(KEYS.accessToken),
  setToken: (token: string) => SecureStore.setItemAsync(KEYS.accessToken, token),
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token),
  clearAll: () =>
    Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]),
}
