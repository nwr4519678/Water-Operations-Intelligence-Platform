// src/api/client.ts
import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "../store/authStore"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5102"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
})

const REFRESH_BEFORE_EXPIRY_SECONDS = 120
let refreshPromise: Promise<string> | null = null

function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    return typeof decoded.exp === "number" ? decoded.exp : null
  } catch {
    return null
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) throw new Error("No refresh session available")

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken })
      .then((response) => {
        const { accessToken, refreshToken: nextRefreshToken } = response.data
        useAuthStore.getState().setAuth(accessToken, nextRefreshToken)
        return accessToken as string
      })
      .catch((error) => {
        // Only clear auth if the refresh endpoint itself explicitly rejected
        // the token with 401. Any other error (network, 5xx) keeps the session.
        if (error.response?.status === 401) {
          useAuthStore.getState().clearAuth()
        }
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// Attach a valid JWT Bearer on every request. Refresh it shortly before expiry
// so normal navigation does not have to wait for a 401 response.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (!token) return config

  const expiry = getTokenExpiry(token)
  const shouldRefresh =
    expiry !== null && expiry - Math.floor(Date.now() / 1000) <= REFRESH_BEFORE_EXPIRY_SECONDS

  if (shouldRefresh && !config.url?.includes("/auth/refresh")) {
    try {
      const nextToken = await refreshAccessToken()
      config.headers.Authorization = `Bearer ${nextToken}`
      return config
    } catch {
      // On any network/server error during refresh, fall back to the
      // current token and let the request proceed. The user stays logged
      // in. clearAuth() is only called after a true 401 from the refresh endpoint.
      config.headers.Authorization = `Bearer ${token}`
      return config
    }
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const accessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError: unknown) {
        // Only sign the user out if the REFRESH endpoint itself returned 401
        // (i.e. the refresh token is truly revoked/expired on the server).
        // Network errors, timeouts, or 5xx from the refresh call must NOT
        // clear the local session.
        const isRefreshRejected =
          typeof refreshError === "object" &&
          refreshError !== null &&
          "response" in refreshError &&
          (refreshError as { response?: { status?: number } }).response?.status === 401
        if (isRefreshRejected) {
          useAuthStore.getState().clearAuth()
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
