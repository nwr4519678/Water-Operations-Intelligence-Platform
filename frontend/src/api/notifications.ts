// src/api/notifications.ts
import { apiClient } from './client';
import { NotificationDto, NotificationPreferenceDto, PagedResult } from '../types/api';

export const notificationsApi = {
  listNotifications: async (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }): Promise<PagedResult<NotificationDto>> => {
    const res = await apiClient.get<PagedResult<NotificationDto>>('/api/v1/notifications', { params });
    return res.data;
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
    return res.data;
  },

  markRead: async (notificationId: number): Promise<void> => {
    await apiClient.post(`/api/v1/notifications/${notificationId}/read`);
  },

  getPreferences: async (): Promise<NotificationPreferenceDto[]> => {
    const res = await apiClient.get<NotificationPreferenceDto[]>('/api/v1/settings/notification-preferences');
    return res.data;
  },

  savePreference: async (data: NotificationPreferenceDto): Promise<void> => {
    await apiClient.put('/api/v1/settings/notification-preferences', data);
  }
};

