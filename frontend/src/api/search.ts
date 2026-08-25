// src/api/search.ts
import { apiClient } from "./client"
import { SearchResultDto, ShareSnapshotDto } from "../types/api"
import { mockAlarms } from "./viewer"
import { mockReportsList } from "./reports"
import { allStations } from "../data/stationsData"

export const searchApi = {
  search: async (
    query: string,
    includeUsers: boolean = false,
  ): Promise<SearchResultDto> => {
    try {
      const res = await apiClient.get<SearchResultDto>("/api/v1/search", {
        params: { query, includeUsers },
      })
      return res.data
    } catch {
      const q = query.trim().toLowerCase()
      if (!q) {
        return { stations: [], alarms: [], reports: [] }
      }

      const matchingStations = allStations
        .filter((s) =>
          `${s.id} ${s.nameEn} ${s.nameAr} ${s.zoneEn} ${s.zoneAr} ${s.typeEn}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 8)
        .map((s) => ({
          stationId: s.id,
          organizationId: "org-eg-telemetry",
          regionId: s.zoneEn.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          stationCode: s.id,
          name: s.nameEn,
          nameAr: s.nameAr,
          nameEn: s.nameEn,
          status: (s.status === "online"
            ? "ONLINE"
            : s.status === "warning"
              ? "MAINTENANCE"
              : "OFFLINE") as "ONLINE" | "OFFLINE" | "MAINTENANCE",
          latitude: s.lat,
          longitude: s.lng,
          elevationMeters: 50,
          staffGaugeHeight: 3.5,
          currentWaterLevel: parseFloat(s.level) || 2.5,
          waterLevelUnit: "m",
          lastReadingUtc: new Date().toISOString(),
          category: s.category,
          zoneAr: s.zoneAr,
          zoneEn: s.zoneEn,
          flowRate: s.flow,
          pressureBar: s.pressure,
          quality: s.quality,
        }))

      const matchingAlarms = mockAlarms
        .filter((a) =>
          `${a.alarmId} ${a.message} ${a.stationName} ${a.severity}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 5)

      const matchingReports = mockReportsList
        .filter((r) =>
          `${r.reportId} ${r.title} ${r.reportType}`.toLowerCase().includes(q),
        )
        .slice(0, 5)

      return {
        stations: matchingStations,
        alarms: matchingAlarms,
        reports: matchingReports,
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
