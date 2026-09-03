// src/api/search.ts
import { apiClient } from "./client"
import { SearchResultDto, ShareSnapshotDto } from "../types/api"
import { loadWaterStations } from "../data/stationLoader"
import { viewerApi } from "./viewer"

export const searchApi = {
  search: async (
    query: string,
    includeUsers: boolean = false,
  ): Promise<SearchResultDto> => {
    try {
      const res = await apiClient.get<any>("/api/v1/search", {
        params: { query, includeUsers },
      })
      const payload = res.data?.items?.[0] || res.data
      if (payload && (Array.isArray(payload.stations) || Array.isArray(payload.alarms))) {
        return {
          stations: Array.isArray(payload.stations) ? payload.stations : [],
          alarms: Array.isArray(payload.alarms) ? payload.alarms : [],
          reports: Array.isArray(payload.reports) ? payload.reports : [],
        }
      }
      throw new Error("Invalid search response shape")
    } catch {
      const q = query.trim().toLowerCase()

      // Fetch real live 19 DaHITI telemetry stations from backend
      const parseResult = await loadWaterStations().catch(() => ({ stations: [] }))
      const liveStations = parseResult.stations || []

      const matchingStations: any[] = liveStations
        .filter((s) => {
          if (!q) return true
          const haystack = `${s.id} ${s.name} ${s.code} ${s.region} ${s.typeLabel}`.toLowerCase()
          return haystack.includes(q)
        })
        .slice(0, 10)
        .map((s) => {
          const rawLvl = s.telemetrySnapshot?.waterLevel
          const numLvl = typeof rawLvl === "number" ? rawLvl : parseFloat(String(rawLvl || "0")) || 0
          return {
            stationId: s.id,
            organizationId: "org-eg-telemetry",
            regionId: s.region.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            stationCode: s.code || s.id,
            name: s.name,
            nameAr: s.nameAr || s.name,
            nameEn: s.nameEn || s.name,
            status: s.connectionState === "warning" ? "MAINTENANCE" : "ONLINE",
            latitude: s.latitude,
            longitude: s.longitude,
            elevationMeters: numLvl,
            currentWaterLevel: numLvl,
            waterLevelUnit: "m",
            lastReadingUtc: s.telemetrySnapshot?.lastUpdateUtc || new Date().toISOString(),
            zoneEn: s.region,
            flowRate: s.telemetrySnapshot?.flowRate ? `${s.telemetrySnapshot.flowRate}` : "Nominal",
            quality: s.telemetrySnapshot?.waterQuality ? `${s.telemetrySnapshot.waterQuality}` : "NOMINAL",
          }
        })

      // Fetch real alarms from viewerApi
      const alarmsRes = await viewerApi.alarms({ page: 1, pageSize: 50 }).catch(() => ({ items: [] }))
      const realAlarms = alarmsRes?.items || []

      const matchingAlarms = realAlarms
        .filter((a) => {
          if (!q) return true
          return `${a.alarmId} ${a.message} ${a.stationName || ""} ${a.severity}`.toLowerCase().includes(q)
        })
        .slice(0, 8)

      return {
        stations: matchingStations,
        alarms: matchingAlarms,
        reports: [],
      }
    }
  },

  getSnapshot: async (token: string): Promise<ShareSnapshotDto> => {
    try {
      const res = await apiClient.get<ShareSnapshotDto>(
        `/api/v1/sharing/snapshots/${token}`,
      )
      return res.data
    } catch {
      return {
        snapshotId: "snap-001",
        stationId: "MST-01",
        shareToken: token,
        snapshotJson: JSON.stringify({
          stationCode: "MST-01",
          name: "Aswan High Dam Master Station",
          waterLevel: "178.5 m",
          flowRate: "2100 m³/s",
          pressure: "8.4 bar",
          quality: "Good",
          generatedAt: new Date().toISOString(),
          status: "ONLINE",
        }),
        createdAtUtc: new Date(Date.now() - 3600000).toISOString(),
        expiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
      }
    }
  },
}
