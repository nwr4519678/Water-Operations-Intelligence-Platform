// src/api/ai.ts
import axios from "axios"
import { apiClient } from "./client"
import { addMonths } from "date-fns"
import { addDays } from "date-fns"
import {
  AiAnomalyItem,
  AiForecastPayload,
  AiInsightDto,
  AiWaterLevelPayload,
  PagedResult,
} from "../types/api"

// Dedicated client for Python FastAPI AI engine (port 8000 via Vite proxy).
// Must NOT use the apiClient (which has baseURL=localhost:5102 + JWT interceptors).
// We use the current page's origin so /ai-engine/* routes through the Vite dev proxy.
const AI_ENGINE_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:8443"
const aiEngineClient = axios.create({
  baseURL: AI_ENGINE_ORIGIN,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
})

// ── AI Engine model metadata types (from Python /v1/models) ─────────────────
export interface AiModelBenchmarkMetrics {
  mae_meters: number
  rmse_meters: number
  r2_score: number
}
export interface AiModelEvaluation {
  trained_estimators?: string[]
  test_split_evaluation?: {
    sample_count: number
    accuracy: number
    precision: number
    recall: number
    f1_score: number
  }
  full_dataset_evaluation?: {
    sample_count: number
    accuracy: number
    precision: number
    recall: number
    f1_score: number
  }
}
export interface AiModelBenchmark {
  dataset_samples?: number
  anomaly_positive_samples?: number
  overall_metrics?: { enhanced_model?: AiModelBenchmarkMetrics }
  total_valid_samples?: number
  best_by_mae?: string
  performance_gain?: Record<string, number | null>
}
export interface AiModelInfo {
  model_name: string
  model_version: string
  status: string
  features: string[]
  artifact_format?: string
  training_dataset?: { name: string; sha256?: string; row_count?: number }
  evaluation?: AiModelEvaluation
  benchmark?: AiModelBenchmark
}
export interface AiModelsResponse {
  status: string
  models: AiModelInfo[]
}
export interface AiHealthResponse {
  status: string
  service: string
  version: string
  models_loaded: string[]
}

// The local inference service loads real model artefacts and is intentionally
// single-worker. Queue DaHITI requests so opening AI Hub cannot flood it with
// nineteen forecasts at once and trip the API circuit breaker.
let dahitiInferenceTail: Promise<void> = Promise.resolve()

async function runDahitiInference<T>(work: () => Promise<T>): Promise<T> {
  const previous = dahitiInferenceTail
  let release!: () => void
  dahitiInferenceTail = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous
  try {
    return await work()
  } finally {
    release()
  }
}

async function getDahitiInsight(
  stationId: string,
  insightType: "forecast" | "anomaly" | "risk-score",
): Promise<AiInsightDto> {
  const dahitiId = stationId.replace(/^DAHITI-/, "")
  return runDahitiInference(async () => {
    const response = await apiClient.get<AiInsightDto>(
      `/api/v1/dahiti/${dahitiId}/ai`,
      { params: { insightType } },
    )
    return response.data
  })
}

function mapForecastPayload(data: AiInsightDto): AiInsightDto {
  const payload = data.payload as {
    forecasts?: AiWaterLevelPayload["forecasts"]
    forecast_anchor_utc?: string
    forecast_horizon_days?: number[]
  }
  if (!payload.forecasts) return data

  const { target_wse_1d, target_wse_7d, target_wse_14d, target_wse_30d } =
    payload.forecasts
  const values = [target_wse_1d, target_wse_7d, target_wse_14d, target_wse_30d]

  return {
    ...data,
    payload: {
      forecastPoints: values.map((predictedValue, index) => {
        const anchor = payload.forecast_anchor_utc
          ? new Date(payload.forecast_anchor_utc)
          : new Date(data.generatedAtUtc)
        const daysOffset = payload.forecast_horizon_days?.[index]
        const date =
          daysOffset != null && daysOffset >= 25 * (index + 1)
            ? addDays(anchor, daysOffset)
            : addMonths(anchor, index + 1)

        return {
          timestampUtc: date.toISOString(),
          predictedValue,
          upperConfidenceBound: predictedValue,
          lowerConfidenceBound: predictedValue,
        }
      }),
    } satisfies AiForecastPayload,
  }
}

export const aiApi = {
  anomalies: async (params?: {
    page?: number
    pageSize?: number
  }): Promise<PagedResult<AiInsightDto>> => {
    const response = await apiClient.get<Array<{
      stationId: string
      stationName: string
      reasonCode: string
      score: number
      detectedAtUtc: string
    }>>("/api/v1/dahiti/ai/anomalies")
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const items: AiInsightDto[] = response.data.map((anomaly) => ({
      insightType: "anomaly",
      stationId: anomaly.stationId,
      payload: {
        id: `${anomaly.stationId}-${anomaly.detectedAtUtc}`,
        stationId: anomaly.stationId,
        stationName: anomaly.stationName,
        parameter: anomaly.reasonCode,
        severity: anomaly.score >= 0.8 ? "CRITICAL" : "WARNING",
        expectedValue: null,
        actualValue: null,
        unit: "AI score",
        confidenceScore: anomaly.score,
        detectedAtUtc: anomaly.detectedAtUtc,
        status: "ACTIVE",
      } satisfies AiAnomalyItem,
      generatedAtUtc: anomaly.detectedAtUtc,
      modelVersion: "DaHITI anomaly detector",
    }))

    return {
      items,
      page,
      pageSize,
      totalCount: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    }
  },

  focusStations: async (asOfUtc?: string): Promise<AiInsightDto> => {
    const response = await apiClient.get<AiInsightDto>(
      "/api/v1/ai/focus-stations",
      { params: { asOfUtc } },
    )
    return response.data
  },

  forecast: async (
    stationId: string,
    asOfUtc?: string,
  ): Promise<AiInsightDto> => {
    const data = stationId.startsWith("DAHITI-")
      ? await getDahitiInsight(stationId, "forecast")
      : (
          await apiClient.get<AiInsightDto>(
            `/api/v1/ai/forecast/${stationId}`,
            { params: { asOfUtc } },
          )
        ).data
    return mapForecastPayload(data)
  },

  riskScore: async (params?: {
    stationId?: string
    asOfUtc?: string
  }): Promise<AiInsightDto> => {
    if (params?.stationId?.startsWith("DAHITI-")) {
      return getDahitiInsight(params.stationId, "risk-score")
    }
    const response = await apiClient.get<AiInsightDto>("/api/v1/ai/risk-score", {
      params,
    })
    return response.data
  },

  maintenance: async (params?: {
    stationId?: string
    asOfUtc?: string
  }): Promise<AiInsightDto> => {
    const response = await apiClient.get<AiInsightDto>(
      "/api/v1/ai/maintenance/predictions",
      { params },
    )
    return response.data
  },

  clusters: async (asOfUtc?: string): Promise<AiInsightDto> => {
    const response = await apiClient.get<AiInsightDto>(
      "/api/v1/ai/stations/clusters",
      { params: { asOfUtc } },
    )
    return response.data
  },

  reportSummary: async (reportId: string): Promise<AiInsightDto> => {
    const response = await apiClient.get<AiInsightDto>(
      `/api/v1/ai/reports/${reportId}/summary`,
    )
    return response.data
  },

  faultProbability: async (alarmId: string): Promise<AiInsightDto> => {
    const response = await apiClient.get<AiInsightDto>(
      `/api/v1/ai/alarms/${alarmId}/fault-probability`,
    )
    return response.data
  },

  stationInsight: async (
    stationId: string,
    insightType: string = "anomaly",
  ): Promise<AiInsightDto> => {
    if (stationId.startsWith("DAHITI-")) {
      return getDahitiInsight(stationId, "anomaly")
    }
    const response = await apiClient.get<AiInsightDto>(
      `/api/v1/ai/insights/${stationId}`,
      { params: { insightType } },
    )
    return response.data
  },

  /**
   * Fetch real model metadata and benchmark metrics from the Python AI microservice.
   * Tries Vite proxy (/ai-engine/v1/models) first, falls back directly to http://localhost:8000/v1/models.
   */
  modelInfo: async (): Promise<AiModelsResponse> => {
    try {
      const response = await aiEngineClient.get<AiModelsResponse>("/ai-engine/v1/models")
      return response.data
    } catch {
      const response = await axios.get<AiModelsResponse>("http://localhost:8000/v1/models", {
        timeout: 10000,
      })
      return response.data
    }
  },

  /**
   * Fetch real AI service health status.
   * Tries Vite proxy (/ai-engine/health) first, falls back directly to http://localhost:8000/health.
   */
  modelHealth: async (): Promise<AiHealthResponse> => {
    try {
      const response = await aiEngineClient.get<AiHealthResponse>("/ai-engine/health")
      return response.data
    } catch {
      const response = await axios.get<AiHealthResponse>("http://localhost:8000/health", {
        timeout: 10000,
      })
      return response.data
    }
  },
}


