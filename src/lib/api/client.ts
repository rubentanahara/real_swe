import axios from 'axios'
import { Config } from '@/constants/config'
import { secureStorage } from '@/lib/storage/secure'

export const apiClient = axios.create({
  baseURL: Config.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // TODO Phase 2: 401 → refresh token → retry
    return Promise.reject(error)
  },
)
