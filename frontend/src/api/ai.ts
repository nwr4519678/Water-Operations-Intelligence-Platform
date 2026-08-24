// src/api/ai.ts
import { apiClient } from "./client"
import {
  AiInsightDto,
  AiForecastPayload,
  AiRiskScorePayload,
  AiMaintenancePayload,
  AiFocusStationPayload,
  AiFaultProbabilityPayload,
  AiClusterPayload,
  PagedResult,
  AiAnomalyItem,
} from "../types/api"
import { allStations } from "../data/stationsData"

export const mockAnomaliesList: AiAnomalyItem[] = [
  {
    id: "anom-1",
    stationId: "MST-01",
    stationName: "Aswan High Dam Master Station",
    parameter: "Lake Level Elevation",
    severity: "CRITICAL",
    expectedValue: 177.2,
    actualValue: 178.5,
    unit: "m",
    confidenceScore: 0.94,
    detectedAtUtc: new Date(Date.now() - 25 * 60000).toISOString(),
    status: "ACTIVE",
  },
  {
    id: "anom-2",
    stationId: "MST-05",
    stationName: "Lake Manzala Main Outlet Master",
    parameter: "Salinity TDS",
    severity: "WARNING",
    expectedValue: 3200,
    actualValue: 4850,
    unit: "ppm",
    confidenceScore: 0.89,
    detectedAtUtc: new Date(Date.now() - 45 * 60000).toISOString(),
    status: "ACTIVE",
  },
  {
    id: "anom-3",
    stationId: "RTU-2092",
    stationName: "Field Telemetry Station RTU-2092",
    parameter: "Signal Latency",
    severity: "WARNING",
    expectedValue: 45,
    actualValue: 1800,
    unit: "sec",
    confidenceScore: 0.91,
    detectedAtUtc: new Date(Date.now() - 80 * 60000).toISOString(),
    status: "ACKNOWLEDGED",
  },
  {
    id: "anom-4",
    stationId: "MST-07",
    stationName: "Kharga Oasis Deep Aquifer Master",
    parameter: "Dynamic Drawdown Rate",
    severity: "INFO",
    expectedValue: 8.2,
    actualValue: 8.9,
    unit: "m",
    confidenceScore: 0.81,
    detectedAtUtc: new Date(Date.now() - 140 * 60000).toISOString(),
    status: "ACTIVE",
  },
  {
    id: "anom-5",
    stationId: "RTU-2210",
    stationName: "Field Telemetry Station RTU-2210",
    parameter: "Open Channel Flow Velocity",
    severity: "INFO",
    expectedValue: 1.2,
    actualValue: 1.8,
    unit: "m/s",
    confidenceScore: 0.76,
    detectedAtUtc: new Date(Date.now() - 220 * 60000).toISOString(),
    status: "ACKNOWLEDGED",
  },
]

export const aiApi = {
  anomalies: async (params?: {
    page?: number
    pageSize?: number
  }): Promise<PagedResult<AiInsightDto>> => {
    try {
      const res = await apiClient.get<PagedResult<AiInsightDto>>(
        "/api/v1/ai/anomalies",
        { params },
      )
      return res.data
    } catch {
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      const items: AiInsightDto[] = mockAnomaliesList.map((a) => ({
        insightType: "anomaly",
        stationId: a.stationId,
        payload: a,
        generatedAtUtc: a.detectedAtUtc,
        modelVersion: "AnomalyNet v3.2",
      }))
      return {
        items,
        page,
        pageSize,
        totalCount: items.length,
        totalPages: Math.ceil(items.length / pageSize),
      }
    }
  },

  focusStations: async (asOfUtc?: string): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        "/api/v1/ai/focus-stations",
        { params: { asOfUtc } },
      )
      return res.data
    } catch {
      const payload: AiFocusStationPayload = {
        stations: [
          {
            stationId: "MST-01",
            name: "Aswan High Dam Master Station",
            stationCode: "MST-01",
            riskScore: 76,
            primaryRiskFactor: "High lake elevation surge",
          },
          {
            stationId: "MST-05",
            name: "Lake Manzala Main Outlet Master",
            stationCode: "MST-05",
            riskScore: 68,
            primaryRiskFactor: "Tidal salinity intrusion",
          },
          {
            stationId: "MST-07",
            name: "Kharga Oasis Deep Aquifer Master",
            stationCode: "MST-07",
            riskScore: 59,
            primaryRiskFactor: "High dynamic drawdown",
          },
          {
            stationId: "MST-02",
            name: "Delta Barrages Strategic Master",
            stationCode: "MST-02",
            riskScore: 44,
            primaryRiskFactor: "Seasonal flow reallocation",
          },
          {
            stationId: "MST-08",
            name: "Toshka Spillway & Regulators",
            stationCode: "MST-08",
            riskScore: 36,
            primaryRiskFactor: "Regular peak discharge",
          },
          {
            stationId: "MST-04",
            name: "New Assiut Barrage Master Station",
            stationCode: "MST-04",
            riskScore: 28,
            primaryRiskFactor: "Optimal hydroelectric balance",
          },
        ],
      }
      return {
        insightType: "focus-stations",
        stationId: null,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "RiskRank v2.4",
      }
    }
  },

  forecast: async (
    stationId: string,
    asOfUtc?: string,
  ): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        `/api/v1/ai/forecast/${stationId}`,
        { params: { asOfUtc } },
      )
      return res.data
    } catch {
      const now = Date.now()
      const forecastPoints = []
      for (let i = 3; i <= 48; i += 3) {
        const t = new Date(now + i * 3600000).toISOString()
        const base = 2.5 + Math.sin(i / 8) * 0.45
        const flowBase = 320 + Math.sin(i / 6) * 55
        const pressureBase = 4.1 + Math.cos(i / 10) * 0.4

        forecastPoints.push({
          timestampUtc: t,
          predictedValue: parseFloat(base.toFixed(2)),
          upperConfidenceBound: parseFloat(
            (base + 0.22 + i * 0.005).toFixed(2),
          ),
          lowerConfidenceBound: parseFloat(
            (base - 0.22 - i * 0.005).toFixed(2),
          ),
          predictedFlow: Math.round(flowBase),
          upperFlowBound: Math.round(flowBase + 25 + i * 0.5),
          lowerFlowBound: Math.round(flowBase - 25 - i * 0.5),
          predictedPressure: parseFloat(pressureBase.toFixed(2)),
        })
      }
      const payload: AiForecastPayload = { forecastPoints }
      return {
        insightType: "forecast",
        stationId,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "HydrologicForecast-LSTM v3.1",
      }
    }
  },

  riskScore: async (params?: {
    stationId?: string
    asOfUtc?: string
  }): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>("/api/v1/ai/risk-score", {
        params,
      })
      return res.data
    } catch {
      const isAswan = params?.stationId === "MST-01"
      const payload: AiRiskScorePayload = {
        riskScore: isAswan ? 76 : 64,
        riskCategory: isAswan ? "HIGH" : "MEDIUM",
        contributingFactors: [
          "Seasonal inflow elevation trend",
          "Downstream canal intake demand variance",
          "Solar battery voltage degradation index",
          "Telemetry packet loss anomaly",
        ],
      }
      return {
        insightType: "risk-score",
        stationId: params?.stationId || null,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "RiskEngine-XGB v2.9",
      }
    }
  },

  maintenance: async (params?: {
    stationId?: string
    asOfUtc?: string
  }): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        "/api/v1/ai/maintenance/predictions",
        { params },
      )
      return res.data
    } catch {
      const payload: AiMaintenancePayload = {
        predictions: [
          {
            equipmentComponent: "Ultrasonic Level Sensor Gauge",
            failureProbability: 0.78,
            estimatedDaysToFailure: 12,
            recommendedAction:
              "Clean transducer head and calibrate zero-point offset",
          },
          {
            equipmentComponent: "Main Discharge Hydraulic Gate Valve",
            failureProbability: 0.62,
            estimatedDaysToFailure: 24,
            recommendedAction:
              "Lubricate actuator stem and inspect oil seal pressure",
          },
          {
            equipmentComponent: "Solar MPPT Battery Inverter",
            failureProbability: 0.44,
            estimatedDaysToFailure: 45,
            recommendedAction:
              "Replace secondary lead-acid cell pack with lithium module",
          },
          {
            equipmentComponent: "ADCP Flow Velocity Sensor",
            failureProbability: 0.29,
            estimatedDaysToFailure: 78,
            recommendedAction:
              "Routine bio-fouling wipe and compass calibration",
          },
        ],
      }
      return {
        insightType: "maintenance",
        stationId: params?.stationId || null,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "PredictiveMaint v1.8",
      }
    }
  },

  clusters: async (asOfUtc?: string): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        "/api/v1/ai/stations/clusters",
        { params: { asOfUtc } },
      )
      return res.data
    } catch {
      const payload: AiClusterPayload = {
        clusters: [
          {
            clusterId: 1,
            clusterName: "Nile Delta Drainage High Density Sector",
            stationIds: ["MST-02", "MST-05", "MST-06", "RTU-2001", "RTU-2050"],
            centroidLatitude: 30.85,
            centroidLongitude: 31.15,
          },
          {
            clusterId: 2,
            clusterName: "Upper Egypt Barrage Cascade",
            stationIds: ["MST-01", "MST-04", "RTU-2180", "RTU-2220"],
            centroidLatitude: 26.5,
            centroidLongitude: 31.5,
          },
          {
            clusterId: 3,
            clusterName: "Western Desert Deep Aquifer Basin",
            stationIds: ["MST-03", "MST-07", "RTU-2340", "RTU-2365"],
            centroidLatitude: 26.0,
            centroidLongitude: 28.5,
          },
          {
            clusterId: 4,
            clusterName: "Toshka & South Valley Axis",
            stationIds: ["MST-08", "RTU-2380", "RTU-2400"],
            centroidLatitude: 22.6,
            centroidLongitude: 31.7,
          },
        ],
      }
      return {
        insightType: "clusters",
        stationId: null,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "SpatialCluster-DBSCAN v2.1",
      }
    }
  },

  reportSummary: async (reportId: string): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        `/api/v1/ai/reports/${reportId}/summary`,
      )
      return res.data
    } catch {
      return {
        insightType: "summary",
        stationId: null,
        payload: `Executive AI Summary for Report (${reportId}):
- Network operating at 94.2% nominal uptime across all 410 monitoring nodes.
- High Dam Lake Nasser elevation is currently 178.5 m, experiencing controlled seasonal discharge into Toshka Spillway.
- Delta networks reported minor turbidity variations during tidal shifts, handled by automated intake gates.
- No structural anomalies detected in strategic barrages or deep well pumps.
- Recommendation: Maintain current discharge allocation and inspect GPRS transmission battery at RTU-2092.`,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "HydrologicLLM-Ops v1.2",
      }
    }
  },

  faultProbability: async (alarmId: string): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        `/api/v1/ai/alarms/${alarmId}/fault-probability`,
      )
      return res.data
    } catch {
      const payload: AiFaultProbabilityPayload = {
        faultProbability: 0.84,
        rootCauses: [
          "Sudden upstream inflow surge (>150 m³/s within 2 hours)",
          "High water level sensor hysteresis delay",
          "Downstream regulator gate partial restriction",
        ],
        suggestedLabel: "Hydrological Surge Event",
      }
      return {
        insightType: "fault-probability",
        stationId: null,
        payload,
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "AlarmDiagnosis-GNN v2.0",
      }
    }
  },

  stationInsight: async (
    stationId: string,
    insightType: string = "anomaly",
  ): Promise<AiInsightDto> => {
    try {
      const res = await apiClient.get<AiInsightDto>(
        `/api/v1/ai/insights/${stationId}`,
        { params: { insightType } },
      )
      return res.data
    } catch {
      const station =
        allStations.find((s) => s.id === stationId) || allStations[0]
      return {
        insightType,
        stationId,
        payload: {
          stationCode: station.id,
          name: station.nameEn,
          currentRiskScore: 68,
          healthSummary: `Station ${station.id} telemetry stream is stable. Water level is within nominal threshold range with 99.4% packet reception consistency.`,
          recentAnomalies: mockAnomaliesList.filter(
            (a) => a.stationId === stationId,
          ),
        },
        generatedAtUtc: new Date().toISOString(),
        modelVersion: "StationInspector v3.0",
      }
    }
  },
}
