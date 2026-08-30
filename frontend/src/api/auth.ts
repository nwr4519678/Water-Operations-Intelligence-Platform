// src/api/auth.ts
import { apiClient } from './client';
import { AuthResponse, LoginRequest, MfaEnrollResponse } from '../types/api';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    return res.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
    return res.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  },

  enrollMfa: async (): Promise<MfaEnrollResponse> => {
    const res = await apiClient.post<MfaEnrollResponse>('/api/v1/auth/mfa/enroll');
    return res.data;
  },

  verifyMfa: async (code: string): Promise<{ verified: boolean }> => {
    const res = await apiClient.post<{ verified: boolean }>('/api/v1/auth/mfa/verify', { code });
    return res.data;
  }
};

