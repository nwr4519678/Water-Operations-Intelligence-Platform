// src/store/authStore.ts
import { create } from "zustand"
import { UserSession } from "../types/api"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  currentUser: UserSession | null
  isAuthenticated: boolean
  setAuth: (
    accessToken: string,
    refreshToken: string,
    user?: Partial<UserSession>,
  ) => void
  clearAuth: () => void
}

function userFromToken(token: string | null): UserSession | null {
  if (!token) return null
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const claims = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")))
    const email = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || claims.email
    const userId = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || claims.sub
    const role = claims.role
    const organizationId = claims.organization
    if (typeof email !== "string" || typeof userId !== "string" || typeof organizationId !== "string") return null
    return { userId, email, name: email, role: role === "ADMIN" || role === "OPERATOR" ? role : "VIEWER", organizationId }
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("wt_access_token"),
  refreshToken: localStorage.getItem("wt_refresh_token"),
  currentUser: userFromToken(localStorage.getItem("wt_access_token")),
  isAuthenticated: Boolean(localStorage.getItem("wt_access_token")),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem("wt_access_token", accessToken)
    localStorage.setItem("wt_refresh_token", refreshToken)
    set((state) => ({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      currentUser: user
        ? { ...state.currentUser, ...user } as UserSession
        : state.currentUser,
    }))
  },

  clearAuth: () => {
    localStorage.removeItem("wt_access_token")
    localStorage.removeItem("wt_refresh_token")
    set({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      isAuthenticated: false,
    })
  },
}))
