// src/api/settings.ts
import { apiClient } from "./client"
import { DashboardLayoutDto, UserPreferencesDto } from "../types/api"

export const settingsApi = {
  getUserPreferences: async (): Promise<UserPreferencesDto> => {
    try {
      const res = await apiClient.get<UserPreferencesDto>("/api/v1/settings/me")
      return res.data
    } catch {
      return {
        theme: "light",
        locale: "en-US",
        timeZone: "Africa/Cairo",
        decimalPrecision: 2,
      }
    }
  },

  updateUserPreferences: async (data: UserPreferencesDto): Promise<void> => {
    try {
      await apiClient.put("/api/v1/settings/me", data)
    } catch {
      // preview
    }
  },

  getDashboardLayouts: async (): Promise<DashboardLayoutDto[]> => {
    try {
      const res = await apiClient.get<DashboardLayoutDto[]>(
        "/api/v1/settings/dashboard-layouts",
      )
      return res.data
    } catch {
      return [
        {
          id: 1,
          layoutName: "Standard Operations View",
          widgetsJson: JSON.stringify([
            "kpi",
            "map",
            "alarms",
            "risk",
            "measurements",
          ]),
          isDefault: true,
          updatedAtUtc: new Date().toISOString(),
        },
      ]
    }
  },
}
