import { useSyncExternalStore } from 'react';
import type { AuthTokens } from './types';

const storageKey = 'water-operations.viewer-session';
let tokens: AuthTokens | null = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as AuthTokens | null;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const notify = () => { listeners.forEach(listener => listener()); };
const persist = () => { tokens ? sessionStorage.setItem(storageKey, JSON.stringify(tokens)) : sessionStorage.removeItem(storageKey); notify(); };

export const authStore = {
  get: () => tokens,
  set: (value: AuthTokens) => { clearTimeout(expiryTimer); const expiresAt = value.expiresAt ?? Date.now() + value.expiresIn * 1000; tokens = { ...value, expiresAt }; expiryTimer = setTimeout(() => authStore.clear(), Math.max(0, expiresAt - Date.now())); persist(); },
  clear: () => { clearTimeout(expiryTimer); tokens = null; persist(); },
  subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
};

export function useAuth() { return useSyncExternalStore(authStore.subscribe, authStore.get, () => null); }
