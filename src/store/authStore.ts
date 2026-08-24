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

const DEFAULT_USER: UserSession = {
  userId: "usr-001",
  email: "viewer.ops@water.gov.eg",
  name: "Eng. Mohamed Atef (Chief Operations)",
  role: "VIEWER",
  organizationId: "org-eg-telemetry",
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:
    localStorage.getItem("wt_access_token") || "demo_jwt_access_token_viewer",
  refreshToken:
    localStorage.getItem("wt_refresh_token") || "demo_jwt_refresh_token_viewer",
  currentUser: DEFAULT_USER,
  isAuthenticated: true,

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
