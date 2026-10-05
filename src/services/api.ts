import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error(
    'VITE_API_URL is not defined. Copy .env.example to .env for local development, ' +
      'or provide VITE_API_URL at build time (Vercel/CI variable).',
  )
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return false
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('refresh_token', res.data.refresh_token)
    return true
  } catch {
    return false
  }
}

function forceLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false

    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true
      if (await tryRefreshToken()) {
        config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`
        return api(config)
      }
      forceLogout()
    }
    return Promise.reject(error)
  },
)
