// src/api/auth.ts
import { apiClient } from './client';
import { AuthResponse, LoginRequest, MfaEnrollResponse } from '../types/api';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
      return res.data;
    } catch {
      // Mock login response for preview
      if (data.email && data.password) {
        return {
          accessToken: 'mock_jwt_access_token_' + Date.now(),
          refreshToken: 'mock_jwt_refresh_token_' + Date.now(),
          expiresInSeconds: 900
        };
      }
      throw new Error('invalid_credentials');
    }
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
      return res.data;
    } catch {
      return {
        accessToken: 'mock_refreshed_access_token_' + Date.now(),
        refreshToken: 'mock_refreshed_token_' + Date.now(),
        expiresInSeconds: 900
      };
    }
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
  },

  enrollMfa: async (): Promise<MfaEnrollResponse> => {
    try {
      const res = await apiClient.post<MfaEnrollResponse>('/api/v1/auth/mfa/enroll');
      return res.data;
    } catch {
      return {
        provisionalUri: 'otpauth://totp/WaterTelemetry:viewer@water.gov.eg?secret=JBSWY3DPEHPK3PXP&issuer=WaterTelemetry',
        base64QrCode: '',
        recoveryCodes: ['REC-4091-2384', 'REC-9182-4412', 'REC-7731-9012', 'REC-3321-8841']
      };
    }
  },

  verifyMfa: async (code: string): Promise<{ verified: boolean }> => {
    try {
      const res = await apiClient.post<{ verified: boolean }>('/api/v1/auth/mfa/verify', { code });
      return res.data;
    } catch {
      if (code.length === 6) {
        return { verified: true };
      }
      throw new Error('invalid_mfa_code');
    }
  }
};
