// src/api/settings.ts
import { apiClient } from "./client"
import { DashboardLayoutDto, UserPreferencesDto } from "../types/api"

export interface UserProfileDto {
  userId: string
  email: string
  displayName: string
  role: string
  organizationId: string
  organizationName: string
  theme: string
  locale: string
  timeZone: string
  decimalPrecision: number
  isActive: boolean
  createdAtUtc: string
  lastLoginAtUtc: string
}

export interface UpdateProfileRequest {
  displayName: string
  theme?: string
  locale?: string
  timeZone?: string
  decimalPrecision?: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const settingsApi = {
  getProfile: async (): Promise<UserProfileDto> => {
    const res = await apiClient.get<UserProfileDto>("/api/v1/settings/profile")
    return res.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put<{ success: boolean; message: string }>("/api/v1/settings/profile", data)
    return res.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>("/api/v1/settings/change-password", data)
    return res.data
  },

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
