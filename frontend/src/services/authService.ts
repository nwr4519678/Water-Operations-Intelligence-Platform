import { ApiClient } from './apiClient';
import { authStore } from './authStore';
import type { AuthTokens } from './types';

export function createAuthService(client = new ApiClient()) {
  return {
    async login(email: string, password: string) { const result = await client.request<AuthTokens>('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); authStore.set(result); return result; },
    async refresh() { const current = authStore.get(); if (!current) return false; try { authStore.set(await client.request<AuthTokens>('/api/v1/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: current.refreshToken }) }, false)); return true; } catch { authStore.clear(); return false; } },
    async logout() { const current = authStore.get(); if (current) await client.request('/api/v1/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: current.refreshToken }) }).catch(() => undefined); authStore.clear(); },
  };
}
