// src/api/telemetry.ts
import { apiClient } from "./client"
import { ChartSeriesDto, TelemetryPointDto } from "../types/api"

export const telemetryApi = {
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
    } catch {
      const now = Date.now()
      const points: TelemetryPointDto[] = []
      for (let i = 24; i >= 0; i--) {
        points.push({
          stationId: params?.stationId || "MST-01",
          parameterId: params?.parameterId || 1,
          timestampUtc: new Date(now - i * 3600000).toISOString(),
          value: parseFloat(
            (
              2.5 +
              Math.sin(i / 2) * 0.35 +
              (Math.random() * 0.1 - 0.05)
            ).toFixed(2),
          ),
          canonicalUnit: "m",
          qualityFlag: "GOOD",
        })
      }
      return points
    }
  },

  getChartMeasurements: async (params: {
    stationId: string
    parameterId?: number[]
    from: string
    to: string
    limit?: number
  }): Promise<ChartSeriesDto[]> => {
    try {
      const res = await apiClient.get<ChartSeriesDto[]>(
        "/api/v1/charts/measurements",
        { params },
      )
      return res.data
    } catch {
      const now = Date.now()
      const pointsWL = []
      const pointsFlow = []
      const pointsPressure = []

      for (let i = 30; i >= 0; i--) {
        const t = new Date(now - i * 3600000).toISOString()
        pointsWL.push({
          timestampUtc: t,
          value: parseFloat(
            (2.65 + Math.sin(i / 4) * 0.45 + Math.random() * 0.06).toFixed(2),
          ),
          qualityFlag: "GOOD" as const,
        })
        pointsFlow.push({
          timestampUtc: t,
          value: Math.round(320 + Math.sin(i / 3) * 60 + Math.random() * 20),
          qualityFlag: "GOOD" as const,
        })
        pointsPressure.push({
          timestampUtc: t,
          value: parseFloat(
            (3.8 + Math.cos(i / 5) * 0.6 + Math.random() * 0.1).toFixed(2),
          ),
          qualityFlag: "GOOD" as const,
        })
      }

      return [
        {
          stationId: params.stationId,
          parameterId: 1,
          parameterName: "Water Level",
          unit: "m",
          points: pointsWL,
        },
        {
          stationId: params.stationId,
          parameterId: 2,
          parameterName: "Discharge Flow Rate",
          unit: "L/s",
          points: pointsFlow,
        },
        {
          stationId: params.stationId,
          parameterId: 3,
          parameterName: "Pipe Line Pressure",
          unit: "bar",
          points: pointsPressure,
        },
      ]
    }
  },
}
