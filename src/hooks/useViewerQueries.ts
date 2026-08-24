// src/hooks/useViewerQueries.ts
import { useQuery } from "@tanstack/react-query"
import { viewerApi, MapStationsParams, AlarmsParams } from "../api/viewer"
import { QUERY_KEYS } from "../utils/constants"

export function useOperationsOverview(asOf?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.VIEWER_OVERVIEW, asOf],
    queryFn: () => viewerApi.overview(asOf),
    refetchInterval: 30000,
  })
}

export function useMapStations(params?: MapStationsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.MAP_STATIONS, params],
    queryFn: () => viewerApi.mapStations(params),
    staleTime: 60000,
  })
}

export function useStationDetail(stationId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATION_DETAIL, stationId],
    queryFn: () => viewerApi.stationDetail(stationId),
    enabled: Boolean(stationId),
  })
}

export function useAlarmsList(params?: AlarmsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALARMS_LIST, params],
    queryFn: () => viewerApi.alarms(params),
    refetchInterval: 15000,
  })
}

export function useAlarmDetail(alarmId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ALARM_DETAIL, alarmId],
    queryFn: () => viewerApi.alarmDetail(alarmId),
    enabled: Boolean(alarmId),
  })
}

export function useOrganizations() {
  return useQuery({
    queryKey: [QUERY_KEYS.ORGANIZATIONS],
    queryFn: () => viewerApi.organizations(),
  })
}

export function useRegions(orgId: string = "org-eg-telemetry") {
  return useQuery({
    queryKey: [QUERY_KEYS.REGIONS, orgId],
    queryFn: () => viewerApi.regions(orgId),
    enabled: Boolean(orgId),
  })
}

export function useStationAlarms(stationId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STATION_ALARMS, stationId],
    queryFn: () => viewerApi.stationAlarms(stationId),
    enabled: Boolean(stationId),
  })
}
