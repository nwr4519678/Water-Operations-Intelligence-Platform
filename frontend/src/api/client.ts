// src/api/client.ts
import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "../store/authStore"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5102"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
})

// Attach JWT Bearer on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true
      const refreshToken = useAuthStore.getState().refreshToken

      try {
        const res = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        })
        const { accessToken, refreshToken: newRefresh } = res.data
        useAuthStore.getState().setAuth(accessToken, newRefresh)
        pendingQueue.forEach((cb) => cb(accessToken))
        pendingQueue = []
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch {
        useAuthStore.getState().clearAuth()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
