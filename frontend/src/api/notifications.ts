// src/api/notifications.ts
import { apiClient } from "./client"
import {
  NotificationDto,
  NotificationPreferenceDto,
  PagedResult,
} from "../types/api"

interface ApiNotificationDto {
  notificationId?: number
  notificationLogId?: number
  title: string
  body: string
  severity?: string
  channel: "IN_APP" | "EMAIL"
  isRead: boolean
  createdAtUtc: string
  readAtUtc?: string | null
}

function normalizeNotification(item: ApiNotificationDto): NotificationDto {
  return {
    notificationId: item.notificationId ?? item.notificationLogId ?? 0,
    title: item.title,
    body: item.body,
    channel: item.channel,
    isRead: item.isRead,
    createdAtUtc: item.createdAtUtc,
    readAtUtc: item.readAtUtc ?? null,
  }
}

export const notificationsApi = {
  listNotifications: async (params?: {
    unreadOnly?: boolean
    page?: number
    pageSize?: number
  }): Promise<PagedResult<NotificationDto>> => {
    const res = await apiClient.get<{
      data: NotificationDto[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>(
      "/api/v1/notifications",
      { params },
    )
    const items = res.data.data.map(normalizeNotification)
    return {
      items,
      page: res.data.page,
      pageSize: res.data.pageSize,
      totalCount: res.data.total,
      totalPages: res.data.totalPages,
    }
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await apiClient.get<number | { count: number }>(
      "/api/v1/notifications/unread-count",
    )
    return typeof res.data === "number" ? { count: res.data } : res.data
  },

  markRead: async (notificationId: number): Promise<void> => {
    await apiClient.post(`/api/v1/notifications/${notificationId}/read`)
  },

  getPreferences: async (): Promise<NotificationPreferenceDto[]> => {
    const res = await apiClient.get<NotificationPreferenceDto[]>(
      "/api/v1/notifications/preferences",
    )
    return res.data
  },

  savePreference: async (data: NotificationPreferenceDto): Promise<void> => {
    await apiClient.put("/api/v1/notifications/preferences", data)
  },
}
