// src/api/reports.ts
import { apiClient } from "./client"
import { CreateReportRequest, PagedResult, ReportDto } from "../types/api"

export const mockReportsList: ReportDto[] = [
  {
    reportId: "RPT-2026-0823",
    title: "Unified National Telemetry & Irrigation Operations Report",
    reportType: "STATION_SUMMARY",
    format: "PDF",
    status: "READY",
    fileSizeBytes: 1468000,
    createdAtUtc: new Date(Date.now() - 2 * 3600000).toISOString(),
    completedAtUtc: new Date(Date.now() - 1.9 * 3600000).toISOString(),
  },
  {
    reportId: "RPT-2026-0822",
    title: "Water Quality & Salinity Compliance at Coastal Outlets",
    reportType: "ALARM_SUMMARY",
    format: "PDF",
    status: "READY",
    fileSizeBytes: 890000,
    createdAtUtc: new Date(Date.now() - 24 * 3600000).toISOString(),
    completedAtUtc: new Date(Date.now() - 23.9 * 3600000).toISOString(),
  },
  {
    reportId: "RPT-2026-0821",
    title: "Strategic Barrages Pressure & Spillway Flow Analysis",
    reportType: "TELEMETRY_EXPORT",
    format: "EXCEL",
    status: "READY",
    fileSizeBytes: 2726000,
    createdAtUtc: new Date(Date.now() - 48 * 3600000).toISOString(),
    completedAtUtc: new Date(Date.now() - 47.8 * 3600000).toISOString(),
  },
  {
    reportId: "RPT-2026-0820",
    title: "410-Station Network Health & RTU Solar Battery Status",
    reportType: "STATION_SUMMARY",
    format: "PDF",
    status: "READY",
    fileSizeBytes: 3984000,
    createdAtUtc: new Date(Date.now() - 72 * 3600000).toISOString(),
    completedAtUtc: new Date(Date.now() - 71.8 * 3600000).toISOString(),
  },
  {
    reportId: "RPT-2026-0818",
    title: "AI Anomaly Detection & Leakage Pinpoint Summary",
    reportType: "ALARM_SUMMARY",
    format: "PDF",
    status: "READY",
    fileSizeBytes: 1992000,
    createdAtUtc: new Date(Date.now() - 120 * 3600000).toISOString(),
    completedAtUtc: new Date(Date.now() - 119.8 * 3600000).toISOString(),
  },
]

export const reportsApi = {
  listReports: async (params?: {
    reportType?: string
    page?: number
    pageSize?: number
  }): Promise<PagedResult<ReportDto>> => {
    const res = await apiClient.get<PagedResult<ReportDto>>(
      "/api/v1/reports",
      { params },
    )
    return res.data
  },

  createReport: async (data: CreateReportRequest): Promise<ReportDto> => {
    const res = await apiClient.post<ReportDto>("/api/v1/reports", data)
    return res.data
  },

  getReport: async (reportId: string): Promise<ReportDto> => {
    const res = await apiClient.get<ReportDto>(`/api/v1/reports/${reportId}`)
    return res.data
  },

  downloadReportUrl: (reportId: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || "https://localhost:7048"}/api/v1/reports/${reportId}/download`
  },
}
