// src/api/settings.ts
import { apiClient } from './client';
import { DashboardLayoutDto, UserPreferencesDto } from '../types/api';

export const settingsApi = {
  getUserPreferences: async (): Promise<UserPreferencesDto> => {
    const res = await apiClient.get<UserPreferencesDto>('/api/v1/settings/me');
    return res.data;
  },

  updateUserPreferences: async (data: UserPreferencesDto): Promise<void> => {
    await apiClient.put('/api/v1/settings/me', data);
  },

  getDashboardLayouts: async (): Promise<DashboardLayoutDto[]> => {
    const res = await apiClient.get<DashboardLayoutDto[]>('/api/v1/settings/dashboard-layouts');
    return res.data;
  }
};

