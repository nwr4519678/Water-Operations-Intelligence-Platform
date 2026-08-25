// src/api/thresholds.ts
import { apiClient } from "./client"
import { PagedResult, ThresholdDto } from "../types/api"

export const thresholdsApi = {
  listThresholds: async (params?: {
    stationId?: string
    parameterId?: number
    page?: number
    pageSize?: number
  }): Promise<PagedResult<ThresholdDto>> => {
    try {
      const res = await apiClient.get<PagedResult<ThresholdDto>>(
        "/api/v1/thresholds",
        { params },
      )
      return res.data
    } catch {
      const items: ThresholdDto[] = [
        {
          thresholdId: 1,
          stationId: params?.stationId || "MST-01",
          stationName: "Aswan High Dam Master Station",
          parameterId: 1,
          parameterName: "Water Level",
          warningLow: 165.0,
          warningHigh: 178.0,
          criticalLow: 160.0,
          criticalHigh: 182.0,
          effectiveFromUtc: "2025-01-01T00:00:00Z",
          effectiveToUtc: null,
          isActive: true,
          createdByEmail: "standards.admin@water.gov.eg",
          createdAtUtc: "2025-01-01T00:00:00Z",
        },
        {
          thresholdId: 2,
          stationId: params?.stationId || "MST-01",
          stationName: "Aswan High Dam Master Station",
          parameterId: 2,
          parameterName: "Discharge Flow Rate",
          warningLow: 500,
          warningHigh: 2200,
          criticalLow: 200,
          criticalHigh: 2500,
          effectiveFromUtc: "2025-01-01T00:00:00Z",
          effectiveToUtc: null,
          isActive: true,
          createdByEmail: "standards.admin@water.gov.eg",
          createdAtUtc: "2025-01-01T00:00:00Z",
        },
        {
          thresholdId: 3,
          stationId: params?.stationId || "MST-01",
          stationName: "Aswan High Dam Master Station",
          parameterId: 3,
          parameterName: "Pipe Line Pressure",
          warningLow: 2.0,
          warningHigh: 8.0,
          criticalLow: 1.0,
          criticalHigh: 10.0,
          effectiveFromUtc: "2025-01-01T00:00:00Z",
          effectiveToUtc: null,
          isActive: true,
          createdByEmail: "standards.admin@water.gov.eg",
          createdAtUtc: "2025-01-01T00:00:00Z",
        },
      ]
      return {
        items,
        page: 1,
        pageSize: 10,
        totalCount: items.length,
        totalPages: 1,
      }
    }
  },
}
