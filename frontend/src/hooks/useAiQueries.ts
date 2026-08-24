// src/hooks/useAiQueries.ts
import { useQuery } from "@tanstack/react-query"
import { aiApi } from "../api/ai"
import { QUERY_KEYS } from "../utils/constants"

export function useAiAnomalies(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_ANOMALIES, page, pageSize],
    queryFn: () => aiApi.anomalies({ page, pageSize }),
  })
}

export function useAiFocusStations(asOfUtc?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_FOCUS_STATIONS, asOfUtc],
    queryFn: () => aiApi.focusStations(asOfUtc),
    refetchInterval: 60000,
  })
}

export function useAiForecast(stationId: string, asOfUtc?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_FORECAST, stationId, asOfUtc],
    queryFn: () => aiApi.forecast(stationId, asOfUtc),
    enabled: Boolean(stationId),
  })
}

export function useAiRiskScore(stationId?: string, asOfUtc?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_RISK_SCORE, stationId, asOfUtc],
    queryFn: () => aiApi.riskScore({ stationId, asOfUtc }),
  })
}

export function useAiMaintenance(stationId?: string, asOfUtc?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_MAINTENANCE, stationId, asOfUtc],
    queryFn: () => aiApi.maintenance({ stationId, asOfUtc }),
  })
}

export function useAiClusters(asOfUtc?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_CLUSTERS, asOfUtc],
    queryFn: () => aiApi.clusters(asOfUtc),
  })
}

export function useAiReportSummary(reportId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_REPORT_SUMMARY, reportId],
    queryFn: () => aiApi.reportSummary(reportId),
    enabled: Boolean(reportId),
  })
}

export function useAiFaultProbability(alarmId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_FAULT_PROBABILITY, alarmId],
    queryFn: () => aiApi.faultProbability(alarmId),
    enabled: Boolean(alarmId),
  })
}

export function useAiStationInsight(
  stationId: string,
  insightType: string = "anomaly",
) {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_STATION_INSIGHT, stationId, insightType],
    queryFn: () => aiApi.stationInsight(stationId, insightType),
    enabled: Boolean(stationId),
  })
}
