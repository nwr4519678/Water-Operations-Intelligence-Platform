// src/api/notifications.ts
import { apiClient } from './client';
import { NotificationDto, NotificationPreferenceDto, PagedResult } from '../types/api';

export const mockNotifications: NotificationDto[] = [
  { notificationId: 101, title: 'Critical Inflow Alarm at High Dam', body: 'Lake elevation reached 178.5m. Automated gate alert triggered.', channel: 'IN_APP', isRead: false, createdAtUtc: new Date(Date.now() - 15 * 60000).toISOString(), readAtUtc: null },
  { notificationId: 102, title: 'AI Maintenance Alert (Ultrasonic Sensor)', body: 'Station RTU-2092 ultrasonic transducer head offset anomaly detected.', channel: 'IN_APP', isRead: false, createdAtUtc: new Date(Date.now() - 45 * 60000).toISOString(), readAtUtc: null },
  { notificationId: 103, title: 'Daily Telemetry Sync Completed', body: 'All 410 station hydrological feeds synchronized successfully.', channel: 'IN_APP', isRead: true, createdAtUtc: new Date(Date.now() - 120 * 60000).toISOString(), readAtUtc: new Date(Date.now() - 60 * 60000).toISOString() },
  { notificationId: 104, title: 'New Official Report Available', body: 'Water Quality & Salinity Compliance at Coastal Outlets is ready for download.', channel: 'IN_APP', isRead: true, createdAtUtc: new Date(Date.now() - 240 * 60000).toISOString(), readAtUtc: new Date(Date.now() - 180 * 60000).toISOString() },
];

export const notificationsApi = {
  listNotifications: async (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }): Promise<PagedResult<NotificationDto>> => {
    try {
      const res = await apiClient.get<PagedResult<NotificationDto>>('/api/v1/notifications', { params });
      return res.data;
    } catch {
      let filtered = [...mockNotifications];
      if (params?.unreadOnly) {
        filtered = filtered.filter((n) => !n.isRead);
      }
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      return {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    }
  },

  unreadCount: async (): Promise<{ count: number }> => {
    try {
      const res = await apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
      return res.data;
    } catch {
      const count = mockNotifications.filter((n) => !n.isRead).length;
      return { count };
    }
  },

  markRead: async (notificationId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/notifications/${notificationId}/read`);
    } catch {
      const item = mockNotifications.find((n) => n.notificationId === notificationId);
      if (item) item.isRead = true;
    }
  },

  getPreferences: async (): Promise<NotificationPreferenceDto[]> => {
    try {
      const res = await apiClient.get<NotificationPreferenceDto[]>('/api/v1/notifications/preferences');
      return res.data;
    } catch {
      return [
        { channel: 'IN_APP', alarmSeverity: 'CRITICAL', isEnabled: true, dailyDigestEnabled: true },
        { channel: 'IN_APP', alarmSeverity: 'WARNING', isEnabled: true, dailyDigestEnabled: false },
        { channel: 'IN_APP', alarmSeverity: 'INFO', isEnabled: true, dailyDigestEnabled: false },
        { channel: 'EMAIL', alarmSeverity: 'CRITICAL', isEnabled: true, dailyDigestEnabled: true },
        { channel: 'EMAIL', alarmSeverity: 'WARNING', isEnabled: false, dailyDigestEnabled: true },
        { channel: 'EMAIL', alarmSeverity: 'INFO', isEnabled: false, dailyDigestEnabled: false },
      ];
    }
  },

  savePreference: async (data: NotificationPreferenceDto): Promise<void> => {
    try {
      await apiClient.put('/api/v1/notifications/preferences', data);
    } catch {
      // preview
    }
  }
};
