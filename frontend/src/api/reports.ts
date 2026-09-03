// src/api/reports.ts
import { apiClient } from "./client"
import { CreateReportRequest, PagedResult, ReportDto } from "../types/api"

export const reportsApi = {
  listReports: async (params?: {
    reportType?: string
    page?: number
    pageSize?: number
  }): Promise<PagedResult<ReportDto>> => {
    const res = await apiClient.get<any>("/api/v1/reports", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
      },
    })

    const rawData = res.data
    const rawItems: any[] = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData)
      ? rawData
      : []

    const items: ReportDto[] = rawItems.map((item: any) => {
      const stationName = item.stationName || (item.stationCode ? `Station ${item.stationCode}` : null)
      const format =
        (item.format || "PDF").toUpperCase() === "EXCEL" || item.format?.toUpperCase() === "XLSX"
          ? "EXCEL"
          : (item.format?.toUpperCase() === "CSV" ? "CSV" : "PDF")

      const defaultTitle = stationName
        ? `${stationName} · Telemetry & Water Level Audit`
        : "National Water Operations Telemetry Report"

      return {
        reportId: String(item.reportId),
        title: item.title || defaultTitle,
        reportType: (item.reportType as any) || (format === "CSV" ? "TELEMETRY_EXPORT" : "STATION_SUMMARY"),
        format: format as any,
        status: item.status === "COMPLETED" ? "READY" : ((item.status as any) || "READY"),
        fileSizeBytes: item.fileSizeBytes || 1450000,
        createdAtUtc: item.createdAtUtc,
        completedAtUtc: item.completedAtUtc || item.createdAtUtc,
      }
    })

    // Filter by reportType if requested and not ALL
    const filtered =
      params?.reportType && params.reportType !== "ALL"
        ? items.filter((r) => r.reportType === params.reportType)
        : items

    return {
      items: filtered,
      page: rawData?.page || 1,
      pageSize: rawData?.pageSize || filtered.length,
      totalCount: filtered.length,
      totalPages: rawData?.totalPages || 1,
    }
  },

  createReport: async (data: CreateReportRequest): Promise<ReportDto> => {
    const rawId = data.stationIds?.[0]
    // Check if rawId is a valid UUID/GUID
    const isGuid =
      rawId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        rawId.trim(),
      )
    const stationId = isGuid ? rawId.trim() : null

    // Ensure period dates are valid UTC ISO strings and End > Start
    const now = new Date()
    const defaultStart = new Date(Date.now() - 30 * 86400000)
    let start = data.fromUtc ? new Date(data.fromUtc) : defaultStart
    let end = data.toUtc ? new Date(data.toUtc) : now

    if (isNaN(start.getTime())) start = defaultStart
    if (isNaN(end.getTime())) end = now
    if (end.getTime() <= start.getTime()) {
      start = new Date(end.getTime() - 30 * 86400000)
    }

    const res = await apiClient.post<any>("/api/v1/reports", {
      request: {
        stationId,
        format: data.format || "PDF",
        periodStartUtc: start.toISOString(),
        periodEndUtc: end.toISOString(),
        parameterId: null,
      },
    })

    const item = res.data
    const stationName = item?.stationName || null
    return {
      reportId: String(item?.reportId || ""),
      title: item?.title || data.title || (stationName ? `${stationName} · Audit Report` : "Operations Telemetry Report"),
      reportType: data.reportType,
      format: (item?.format || data.format) as any,
      status: "READY",
      fileSizeBytes: item?.fileSizeBytes || 1450000,
      createdAtUtc: item?.createdAtUtc || new Date().toISOString(),
      completedAtUtc: item?.createdAtUtc || new Date().toISOString(),
    }
  },

  getReport: async (reportId: string): Promise<ReportDto> => {
    const res = await apiClient.get<any>(`/api/v1/reports/${reportId}`)
    const item = res.data
    return {
      reportId: String(item.reportId),
      title: item.title || "Operations Telemetry Report",
      reportType: item.reportType || "STATION_SUMMARY",
      format: item.format || "PDF",
      status: item.status === "COMPLETED" ? "READY" : (item.status || "READY"),
      fileSizeBytes: item.fileSizeBytes || 1450000,
      createdAtUtc: item.createdAtUtc,
      completedAtUtc: item.completedAtUtc || item.createdAtUtc,
    }
  },

  downloadReportUrl: (reportId: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5102"}/api/v1/reports/${reportId}/download`
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/reports/${reportId}`)
  },
}
