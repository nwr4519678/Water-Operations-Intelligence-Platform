import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => { sessionStorage.clear(); authStore.clear(); });
  afterEach(() => vi.useRealTimers());
  it('clears session state on logout or refresh expiry', () => {
    authStore.set({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 });
    expect(authStore.get()?.accessToken).toBe('a');
    authStore.clear();
    expect(authStore.get()).toBeNull();
  });
  it('expires the session when its lifetime elapses', () => {
    vi.useFakeTimers();
    authStore.set({ accessToken: 'a', refreshToken: 'r', expiresIn: 1 });
    vi.advanceTimersByTime(1_000);
    expect(authStore.get()).toBeNull();
  });
});
