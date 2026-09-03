// src/data/stationLoader.ts
import { WaterStation, DatasetValidationReport } from "./stationTypes"
import { ParseResult } from "./stationParser"
import { apiClient } from "../api/client"
import { resolveStationLocation } from "../utils/stationLocationResolver"

let cachedResult: ParseResult | null = null
let loadingPromise: Promise<ParseResult> | null = null
const RECENT_READING_WINDOW_DAYS = 90

function hasRecentReading(lastObservedAtUtc: string | null): boolean {
  if (!lastObservedAtUtc) return false
  const timestamp = Date.parse(lastObservedAtUtc)
  return (
    Number.isFinite(timestamp) &&
    Date.now() - timestamp <= RECENT_READING_WINDOW_DAYS * 86400000
  )
}

export async function loadWaterStations(forceRefresh = false): Promise<ParseResult> {
  if (cachedResult && !forceRefresh) {
    return cachedResult
  }

  if (loadingPromise && !forceRefresh) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    const response = await apiClient.get<DahitiStationDto[]>("/api/v1/dahiti/stations")
    const stations = response.data.map(toWaterStation)
    cachedResult = { stations, report: createReport(stations) }
    return cachedResult
  })()

  return loadingPromise
}

export function getCachedStations(): ParseResult {
  return cachedResult ?? { stations: [], report: createReport([]) }
}

export interface DahitiMonthlyTrend {
  month: string
  averageLevel: number
  minimumLevel: number
  maximumLevel: number
  observationCount: number
}

export async function loadMonthlyTrend(
  dahitiId: number,
  months = 12,
): Promise<DahitiMonthlyTrend[]> {
  const response = await apiClient.get<DahitiMonthlyTrend[]>(
    `/api/v1/dahiti/trends/${dahitiId}`,
    {
      params: { months },
    },
  )
  return response.data
}

interface DahitiStationDto {
  stationId: string
  dahitiId: number
  name: string
  country: string
  continent: string
  latitude: number
  longitude: number
  lastSyncedAtUtc: string | null
  lastObservedAtUtc: string | null
  waterLevel: number | null
  uncertainty: number | null
  observationCount: number
}

function toWaterStation(station: DahitiStationDto): WaterStation {
  const isRecent = hasRecentReading(station.lastObservedAtUtc)
  const loc = resolveStationLocation(
    station.dahitiId,
    station.name,
    station.latitude,
    station.longitude,
  )

  return {
    id: station.stationId,
    code: `DAHITI-${station.dahitiId}`,
    name: loc.name,
    nameEn: loc.nameEn,
    type: "master",
    typeLabel: loc.waterbodyType,
    region: loc.reachRegion,
    latitude: station.latitude,
    longitude: station.longitude,
    coordinates: [station.longitude, station.latitude],
    connectionStatus: isRecent
      ? "Recent database reading"
      : "Historical database reading",
    connectionState: isRecent ? "online" : "warning",
    telemetrySnapshot: {
      waterLevel: station.waterLevel ?? "—",
      lastUpdateUtc:
        station.lastObservedAtUtc ?? station.lastSyncedAtUtc ?? undefined,
      isSimulated: false,
    },
  }
}

function createReport(stations: WaterStation[]): DatasetValidationReport {
  const valid = stations.filter(
    (station) =>
      Number.isFinite(station.latitude) && Number.isFinite(station.longitude),
  )
  const minLat = valid.length
    ? Math.min(...valid.map((station) => station.latitude))
    : 0
  const maxLat = valid.length
    ? Math.max(...valid.map((station) => station.latitude))
    : 0
  const minLng = valid.length
    ? Math.min(...valid.map((station) => station.longitude))
    : 0
  const maxLng = valid.length
    ? Math.max(...valid.map((station) => station.longitude))
    : 0

  const uniqueRegions = Array.from(new Set(stations.map((s) => s.region))).sort()

  return {
    totalRows: stations.length,
    validCount: valid.length,
    invalidCount: stations.length - valid.length,
    mainCount: 0,
    masterCount: stations.length,
    rtuCount: 0,
    onlineCount: stations.filter((s) => s.connectionState === "online").length,
    warningCount: stations.filter((s) => s.connectionState === "warning").length,
    offlineCount: 0,
    unknownCount: 0,
    regions: uniqueRegions,
    bounds: {
      minLat,
      maxLat,
      minLng,
      maxLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    },
    errors: [],
  }
}
