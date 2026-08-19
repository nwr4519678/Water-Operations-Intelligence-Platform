import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthSession, LoginResult } from '../types'

const SESSION_KEY = 'echocloud-viewer-session'
const VIEWER_EMAIL = 'viewer@echocloud.meri'
const VIEWER_PASSWORD = 'Viewer@2026'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  secondsRemaining: number
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function isSessionActive(session: AuthSession | null, now = Date.now()): boolean { return Boolean(session && session.expiresAt > now) }

function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try { const session = JSON.parse(raw) as AuthSession; return isSessionActive(session) ? session : null } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(getStoredSession)
  const [now, setNow] = useState(Date.now())
  const logout = useCallback(() => { localStorage.removeItem(SESSION_KEY); setSession(null) }, [])

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (session && !isSessionActive(session, now)) logout() }, [logout, now, session])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 350))
    if (email.trim().toLowerCase() !== VIEWER_EMAIL || password !== VIEWER_PASSWORD) return { success: false, message: 'Use the provided viewer credentials to access the platform.' }
    const nextSession: AuthSession = { email: VIEWER_EMAIL, token: btoa(`${VIEWER_EMAIL}:${Date.now()}:viewer`), expiresAt: Date.now() + 30 * 60 * 1000 }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); setSession(nextSession); return { success: true }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ session, isAuthenticated: isSessionActive(session, now), secondsRemaining: session ? Math.max(0, Math.floor((session.expiresAt - now) / 1000)) : 0, login, logout }), [login, logout, now, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }

export const viewerCredentials = { email: VIEWER_EMAIL, password: VIEWER_PASSWORD }
