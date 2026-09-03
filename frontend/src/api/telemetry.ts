// src/api/telemetry.ts
import { apiClient } from "./client"
import { ChartSeriesDto, TelemetryPointDto } from "../types/api"

export interface DahitiReadingDto {
  observedAtUtc: string
  waterLevel: number
  uncertainty: number | null
}

export const telemetryApi = {
  getDahitiReadings: async (dahitiId: number): Promise<DahitiReadingDto[]> => {
    const res = await apiClient.get<DahitiReadingDto[]>(
      `/api/v1/dahiti/readings/${dahitiId}`,
      { params: { limit: 10000 } },
    )
    return res.data
  },

  getTelemetry: async (params?: {
    stationId?: string
    parameterId?: number
    from?: string
    to?: string
    limit?: number
  }): Promise<TelemetryPointDto[]> => {
    try {
      const res = await apiClient.get<TelemetryPointDto[]>(
        "/api/v1/telemetry",
        { params },
      )
      return res.data
    } catch (error) {
      throw error
    }
  },

  getChartMeasurements: async (params: {
    stationId: string
    parameterId?: number[]
    from: string
    to: string
    limit?: number
  }): Promise<ChartSeriesDto[]> => {
    if (params.stationId.startsWith("DAHITI-")) {
      const dahitiId = params.stationId.replace(/^DAHITI-/, "")
      const requestedMonths = Math.ceil(
        (new Date(params.to).getTime() - new Date(params.from).getTime()) /
          (30 * 86400000),
      )

      // For granular scales (<= 12 months, e.g. 3M, 6M, 12M), fetch exact daily observation passes
      if (requestedMonths <= 12) {
        try {
          const readings = await telemetryApi.getDahitiReadings(Number(dahitiId))
          const fromTime = new Date(params.from).getTime()
          const toTime = new Date(params.to).getTime()
          const filtered = readings.filter((r) => {
            const t = new Date(r.observedAtUtc).getTime()
            return t >= fromTime && t <= toTime
          })
          if (filtered.length > 0) {
            filtered.sort(
              (a, b) =>
                new Date(a.observedAtUtc).getTime() -
                new Date(b.observedAtUtc).getTime(),
            )

            // Deduplicate by calendar day (same logic as uniqueDahitiReadings in the table)
            // This ensures each chart point maps 1:1 to a table row
            const seenDays = new Set<string>()
            const deduplicated = filtered.filter((r) => {
              const dayKey = r.observedAtUtc.split("T")[0]
              if (seenDays.has(dayKey)) return false
              seenDays.add(dayKey)
              return true
            })

            return [
              {
                stationId: params.stationId,
                parameterId: 1,
                parameterName: "Water Level",
                unit: "m",
                points: deduplicated.map((r) => ({
                  timestampUtc: r.observedAtUtc,
                  value: r.waterLevel,
                  qualityFlag: "GOOD" as const,
                })),
              },
            ]
          }
        } catch {
          // Fall back to trends query
        }
      }

      // For long historical overview (24M, ALL), query monthly trend aggregations
      const res = await apiClient.get<Array<{
        month: string
        averageLevel: number
        minimumLevel: number
        maximumLevel: number
        observationCount: number
      }>>(`/api/v1/dahiti/trends/${dahitiId}`, {
        params: { months: Math.min(2400, Math.max(3, requestedMonths)) },
      })
      return [{
        stationId: params.stationId,
        parameterId: 1,
        parameterName: "Water Level",
        unit: "m",
        points: res.data.map((point) => ({
          timestampUtc: point.month,
          value: point.averageLevel,
          qualityFlag: "GOOD" as const,
        })),
      }]
    }

    try {
      const res = await apiClient.get<ChartSeriesDto[]>(
        "/api/v1/charts/measurements",
        { params },
      )
      return res.data
    } catch (error) {
      throw error
    }
  },
}
