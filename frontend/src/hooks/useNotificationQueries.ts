// src/hooks/useNotificationQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "../api/notifications"
import { QUERY_KEYS } from "../utils/constants"

export function useNotificationsList(params?: {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_LIST, params],
    queryFn: () => notificationsApi.listNotifications(params),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATIONS_LIST],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATIONS_UNREAD],
      })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_PREFERENCES],
    queryFn: () => notificationsApi.getPreferences(),
  })
}
