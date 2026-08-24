// src/api/viewer.ts
import { apiClient } from "./client"
import {
  OperationsOverviewDto,
  MapStationDto,
  StationDetailDto,
  AlarmDto,
  OrganizationDto,
  RegionDto,
  StationSummaryDto,
  TelemetryPointDto,
  PagedResult,
} from "../types/api"
import { allStations, masterStations } from "../data/stationsData"

export interface MapStationsParams {
  search?: string
  regionId?: string
  status?: string
  minLatitude?: number
  maxLatitude?: number
  minLongitude?: number
  maxLongitude?: number
  page?: number
  pageSize?: number
}

export interface AlarmsParams {
  stationId?: string
  severity?: string
  status?: string
  page?: number
  pageSize?: number
}

// Convert allStations to MapStationDto format
const mockMapStations: MapStationDto[] = allStations.map((s) => ({
  stationId: s.id,
  organizationId: "org-eg-telemetry",
  regionId: s.zoneEn.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  stationCode: s.id,
  name: s.nameEn,
  nameAr: s.nameAr,
  nameEn: s.nameEn,
  status:
    s.status === "online"
      ? "ONLINE"
      : s.status === "warning"
        ? "MAINTENANCE"
        : "OFFLINE",
  latitude: s.lat,
  longitude: s.lng,
  elevationMeters: s.category === "master" ? 120 : 45,
  staffGaugeHeight: parseFloat(s.level) || 3.0,
  currentWaterLevel: parseFloat(s.level) || 2.5,
  waterLevelUnit: "m",
  lastReadingUtc: new Date(
    Date.now() - (s.status === "offline" ? 3600000 : 120000),
  ).toISOString(),
  category: s.category,
  zoneAr: s.zoneAr,
  zoneEn: s.zoneEn,
  flowRate: s.flow,
  pressureBar: s.pressure,
  quality: s.quality,
  mechanism: s.mechanismEn,
  signal: s.signalEn,
}))

export const mockOrganizations: OrganizationDto[] = [
  {
    organizationId: "org-eg-telemetry",
    name: "Ministry of Water Resources & Irrigation (MWRI)",
    slug: "mwri-egypt",
    logoUrl: null,
    defaultLocale: "en-US",
    defaultTimeZone: "Africa/Cairo",
    isActive: true,
  },
]

export const mockRegions: RegionDto[] = [
  {
    regionId: "delta-irrigation",
    organizationId: "org-eg-telemetry",
    code: "DELTA",
    name: "Delta Irrigation & Drainage",
    description: "Lower Egypt and Delta networks",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "fayoum-basin",
    organizationId: "org-eg-telemetry",
    code: "FAYOUM",
    name: "Fayoum & Bahr Youssef Basin",
    description: "Critical water balance basin",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "upper-egypt",
    organizationId: "org-eg-telemetry",
    code: "UPPER",
    name: "Upper Egypt & Nile Reach",
    description: "Middle and Upper Egypt Nile reaches",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "aswan-valley",
    organizationId: "org-eg-telemetry",
    code: "ASWAN",
    name: "Aswan & South Valley",
    description: "High Dam reservoir and Kom Ombo",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "new-valley",
    organizationId: "org-eg-telemetry",
    code: "OASES",
    name: "New Valley & Nubian Aquifer",
    description: "Deep groundwater aquifer monitoring",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "toshka-axis",
    organizationId: "org-eg-telemetry",
    code: "TOSHKA",
    name: "Toshka Spillway & Axis",
    description: "National reclamation corridor",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
  {
    regionId: "greater-cairo",
    organizationId: "org-eg-telemetry",
    code: "HQ",
    name: "Greater Cairo Operations HQ",
    description: "Central Sovereign Telemetry Command",
    isActive: true,
    createdAtUtc: "2025-01-01T00:00:00Z",
  },
]

export const mockAlarms: AlarmDto[] = [
  {
    alarmId: "alm-1044",
    organizationId: "org-eg-telemetry",
    stationId: "MST-01",
    stationName: "Aswan High Dam Master Station",
    alarmTypeId: 1,
    alarmTypeCode: "HIGH_WATER_LEVEL",
    severity: "CRITICAL",
    status: "ACTIVE",
    raisedAtUtc: new Date(Date.now() - 15 * 60000).toISOString(),
    acknowledgedAtUtc: null,
    acknowledgedByEmail: null,
    resolvedAtUtc: null,
    resolvedByEmail: null,
    message:
      "High water level threshold exceeded (178.5m > 178.0m warning threshold)",
    resolutionNote: null,
    labels: [
      {
        label: "Hydrological Surge",
        confidence: 0.94,
        taggedByEmail: "ai-engine@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.88,
  },
  {
    alarmId: "alm-1043",
    organizationId: "org-eg-telemetry",
    stationId: "MST-02",
    stationName: "Delta Barrages Strategic Master",
    alarmTypeId: 2,
    alarmTypeCode: "LOW_PRESSURE",
    severity: "WARNING",
    status: "ACTIVE",
    raisedAtUtc: new Date(Date.now() - 32 * 60000).toISOString(),
    acknowledgedAtUtc: null,
    acknowledgedByEmail: null,
    resolvedAtUtc: null,
    resolvedByEmail: null,
    message: "Discharge canal booster line pressure drop below 2.0 bar",
    resolutionNote: null,
    labels: [
      {
        label: "Valve Restriction",
        confidence: 0.82,
        taggedByEmail: "ai-engine@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.65,
  },
  {
    alarmId: "alm-1042",
    organizationId: "org-eg-telemetry",
    stationId: "RTU-2092",
    stationName: "Field Telemetry Station RTU-2092",
    alarmTypeId: 3,
    alarmTypeCode: "SENSOR_OFFLINE",
    severity: "WARNING",
    status: "ACKNOWLEDGED",
    raisedAtUtc: new Date(Date.now() - 75 * 60000).toISOString(),
    acknowledgedAtUtc: new Date(Date.now() - 30 * 60000).toISOString(),
    acknowledgedByEmail: "ops.engineer@water.gov.eg",
    resolvedAtUtc: null,
    resolvedByEmail: null,
    message: "GPRS packet transmission delay > 25 mins",
    resolutionNote: "Checking solar inverter battery levels",
    labels: [
      {
        label: "Telecom Dropout",
        confidence: 0.91,
        taggedByEmail: "ai-engine@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.42,
  },
  {
    alarmId: "alm-1041",
    organizationId: "org-eg-telemetry",
    stationId: "MST-05",
    stationName: "Lake Manzala Main Outlet Master",
    alarmTypeId: 4,
    alarmTypeCode: "WATER_QUALITY_DEGRADED",
    severity: "CRITICAL",
    status: "ACTIVE",
    raisedAtUtc: new Date(Date.now() - 110 * 60000).toISOString(),
    acknowledgedAtUtc: null,
    acknowledgedByEmail: null,
    resolvedAtUtc: null,
    resolvedByEmail: null,
    message: "Salinity & TDS turbidity spike detected at coastal barrage gate",
    resolutionNote: null,
    labels: [
      {
        label: "Tidal Influx",
        confidence: 0.96,
        taggedByEmail: "ai-engine@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.79,
  },
  {
    alarmId: "alm-1040",
    organizationId: "org-eg-telemetry",
    stationId: "RTU-2210",
    stationName: "Field Telemetry Station RTU-2210",
    alarmTypeId: 5,
    alarmTypeCode: "FLOW_ANOMALY",
    severity: "INFO",
    status: "ACKNOWLEDGED",
    raisedAtUtc: new Date(Date.now() - 180 * 60000).toISOString(),
    acknowledgedAtUtc: new Date(Date.now() - 90 * 60000).toISOString(),
    acknowledgedByEmail: "ops.engineer@water.gov.eg",
    resolvedAtUtc: null,
    resolvedByEmail: null,
    message: "Slight open channel flow rate oscillation detected",
    resolutionNote: "Logged for daily maintenance inspection",
    labels: [
      {
        label: "Vegetation Drift",
        confidence: 0.74,
        taggedByEmail: "ai-engine@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.28,
  },
  {
    alarmId: "alm-1039",
    organizationId: "org-eg-telemetry",
    stationId: "MST-08",
    stationName: "Toshka Spillway & Regulators Master",
    alarmTypeId: 6,
    alarmTypeCode: "PUMP_OVERLOAD",
    severity: "CRITICAL",
    status: "RESOLVED",
    raisedAtUtc: new Date(Date.now() - 360 * 60000).toISOString(),
    acknowledgedAtUtc: new Date(Date.now() - 300 * 60000).toISOString(),
    acknowledgedByEmail: "chief.ops@water.gov.eg",
    resolvedAtUtc: new Date(Date.now() - 120 * 60000).toISOString(),
    resolvedByEmail: "chief.ops@water.gov.eg",
    message: "Primary spillway motor current exceeded 120A",
    resolutionNote: "Switched to redundant backup turbine regulator",
    labels: [
      {
        label: "Mechanical Load",
        confidence: 0.95,
        taggedByEmail: "chief.ops@water.gov.eg",
        taggedAtUtc: new Date().toISOString(),
      },
    ],
    faultProbability: 0.15,
  },
]

export const viewerApi = {
  overview: async (asOf?: string): Promise<OperationsOverviewDto> => {
    try {
      const res = await apiClient.get<OperationsOverviewDto>(
        "/api/v1/viewer/overview",
        { params: { asOf } },
      )
      return res.data
    } catch {
      const total = mockMapStations.length
      const online = mockMapStations.filter((s) => s.status === "ONLINE").length
      const offline = total - online
      const critical = mockAlarms.filter(
        (a) => a.severity === "CRITICAL" && a.status === "ACTIVE",
      ).length
      const warning = mockAlarms.filter(
        (a) => a.severity === "WARNING" && a.status === "ACTIVE",
      ).length
      return {
        totalStations: total,
        onlineStations: online,
        offlineStations: offline,
        activeCriticalAlarms: critical,
        activeWarningAlarms: warning,
      }
    }
  },

  mapStations: async (
    params?: MapStationsParams,
  ): Promise<PagedResult<MapStationDto>> => {
    try {
      const res = await apiClient.get<PagedResult<MapStationDto>>(
        "/api/v1/viewer/map/stations",
        { params },
      )
      return res.data
    } catch {
      let filtered = [...mockMapStations]
      if (params?.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter((s) =>
          `${s.stationCode} ${s.name} ${s.nameAr || ""} ${s.zoneEn || ""} ${s.zoneAr || ""}`
            .toLowerCase()
            .includes(q),
        )
      }
      if (params?.status && params.status !== "ALL") {
        filtered = filtered.filter((s) => s.status === params.status)
      }
      const page = params?.page || 1
      const pageSize = params?.pageSize || 500
      const totalCount = filtered.length
      const totalPages = Math.ceil(totalCount / pageSize)
      const items = filtered.slice((page - 1) * pageSize, page * pageSize)

      return { items, page, pageSize, totalCount, totalPages }
    }
  },

  stationDetail: async (stationId: string): Promise<StationDetailDto> => {
    try {
      const res = await apiClient.get<StationDetailDto>(
        `/api/v1/viewer/stations/${stationId}`,
      )
      return res.data
    } catch {
      const found =
        allStations.find((s) => s.id === stationId) || allStations[0]
      return {
        stationId: found.id,
        organizationId: "org-eg-telemetry",
        regionId: found.zoneEn.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        stationCode: found.id,
        name: found.nameEn,
        nameAr: found.nameAr,
        nameEn: found.nameEn,
        description: `${found.nameEn} (${found.nameAr}) — Strategic Water Telemetry Node`,
        status:
          found.status === "online"
            ? "ONLINE"
            : found.status === "warning"
              ? "MAINTENANCE"
              : "OFFLINE",
        latitude: found.lat,
        longitude: found.lng,
        elevationMeters: found.category === "master" ? 120 : 45,
        staffGaugeHeight: parseFloat(found.level) || 3.5,
        isActive: true,
        communicationIntervalSeconds: 60,
        createdAtUtc: "2024-01-01T00:00:00Z",
        updatedAtUtc: new Date().toISOString(),
        category: found.category,
        zoneAr: found.zoneAr,
        zoneEn: found.zoneEn,
        mechanismAr: found.mechanismAr,
        mechanismEn: found.mechanismEn,
        signalAr: found.signalAr,
        signalEn: found.signalEn,
        assignedParameters: [
          {
            parameterId: 1,
            code: "WL",
            name: "Water Level",
            canonicalUnit: "m",
            dataType: "Float",
          },
          {
            parameterId: 2,
            code: "FL",
            name: "Discharge Flow Rate",
            canonicalUnit: found.category === "master" ? "m³/s" : "L/s",
            dataType: "Float",
          },
          {
            parameterId: 3,
            code: "PR",
            name: "Pipe Line Pressure",
            canonicalUnit: "bar",
            dataType: "Float",
          },
          {
            parameterId: 4,
            code: "WQ",
            name: "Water Salinity TDS",
            canonicalUnit: "ppm",
            dataType: "Float",
          },
        ],
      }
    }
  },

  alarms: async (params?: AlarmsParams): Promise<PagedResult<AlarmDto>> => {
    try {
      const res = await apiClient.get<PagedResult<AlarmDto>>(
        "/api/v1/viewer/alarms",
        { params },
      )
      return res.data
    } catch {
      let filtered = [...mockAlarms]
      if (params?.stationId) {
        filtered = filtered.filter((a) => a.stationId === params.stationId)
      }
      if (params?.severity && params.severity !== "ALL") {
        filtered = filtered.filter((a) => a.severity === params.severity)
      }
      if (params?.status && params.status !== "ALL") {
        filtered = filtered.filter((a) => a.status === params.status)
      }
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const totalCount = filtered.length
      const totalPages = Math.ceil(totalCount / pageSize)
      const items = filtered.slice((page - 1) * pageSize, page * pageSize)
      return { items, page, pageSize, totalCount, totalPages }
    }
  },

  alarmDetail: async (alarmId: string): Promise<AlarmDto> => {
    try {
      const res = await apiClient.get<AlarmDto>(
        `/api/v1/viewer/alarms/${alarmId}`,
      )
      return res.data
    } catch {
      const a =
        mockAlarms.find((item) => item.alarmId === alarmId) || mockAlarms[0]
      return a
    }
  },

  organizations: async (): Promise<OrganizationDto[]> => {
    try {
      const res = await apiClient.get<OrganizationDto[]>(
        "/api/v1/viewer/organizations",
      )
      return res.data
    } catch {
      return mockOrganizations
    }
  },

  regions: async (organizationId: string): Promise<RegionDto[]> => {
    try {
      const res = await apiClient.get<RegionDto[]>(
        `/api/v1/viewer/organizations/${organizationId}/regions`,
      )
      return res.data
    } catch {
      return mockRegions
    }
  },

  regionStations: async (regionId: string): Promise<StationSummaryDto[]> => {
    try {
      const res = await apiClient.get<StationSummaryDto[]>(
        `/api/v1/viewer/regions/${regionId}/stations`,
      )
      return res.data
    } catch {
      return mockMapStations
        .filter((s) => s.regionId === regionId || regionId === "all")
        .map((s) => ({
          stationId: s.stationId,
          stationCode: s.stationCode,
          name: s.name,
          status: s.status,
          regionId: s.regionId,
          latitude: s.latitude,
          longitude: s.longitude,
          lastReadingUtc: s.lastReadingUtc,
        }))
    }
  },

  stationMeasurements: async (
    stationId: string,
    params?: { from?: string; to?: string; parameterId?: number; limit?: number },
  ): Promise<TelemetryPointDto[]> => {
    try {
      const res = await apiClient.get<TelemetryPointDto[]>(
        `/api/v1/viewer/stations/${stationId}/measurements`,
        { params },
      )
      return res.data
    } catch {
      const now = Date.now()
      const points: TelemetryPointDto[] = []
      for (let i = 24; i >= 0; i--) {
        points.push({
          stationId,
          parameterId: params?.parameterId || 1,
          timestampUtc: new Date(now - i * 3600000).toISOString(),
          value: parseFloat(
            (2.4 + Math.sin(i / 3) * 0.4 + Math.random() * 0.1).toFixed(2),
          ),
          canonicalUnit: "m",
          qualityFlag: "GOOD",
        })
      }
      return points
    }
  },

  stationAlarms: async (stationId: string): Promise<AlarmDto[]> => {
    try {
      const res = await apiClient.get<AlarmDto[]>(
        `/api/v1/viewer/stations/${stationId}/alarms`,
      )
      return res.data
    } catch {
      return mockAlarms.filter((a) => a.stationId === stationId)
    }
  },
}
