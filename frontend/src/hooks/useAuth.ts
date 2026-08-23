// src/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { LoginRequest } from '../types/api';
import { useState } from 'react';

export function useAuth() {
  const { accessToken, refreshToken, currentUser, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      setAuth(res.accessToken, res.refreshToken, {
        email: data.email,
        name: data.email.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'VIEWER'
      });
      return res;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    clearAuth();
  };

  return {
    accessToken,
    refreshToken,
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
}
