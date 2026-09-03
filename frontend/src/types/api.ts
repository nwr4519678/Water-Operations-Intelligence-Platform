// src/types/api.ts

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
}

export interface MfaEnrollResponse {
  provisionalUri: string
  base64QrCode: string
  recoveryCodes: string[]
}

export interface UserSession {
  userId: string
  email: string
  name: string
  role: "VIEWER" | "OPERATOR" | "ADMIN"
  organizationId: string
}

// ─── Viewer ─────────────────────────────────────────────────────────────────────
export interface OperationsOverviewDto {
  totalStations: number
  onlineStations: number
  offlineStations: number
  activeCriticalAlarms: number
  activeWarningAlarms: number
}

export interface OrganizationDto {
  organizationId: string
  name: string
  slug: string
  logoUrl: string | null
  defaultLocale: string
  defaultTimeZone: string
  isActive: boolean
}

export interface RegionDto {
  regionId: string
  organizationId: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  createdAtUtc: string
}

export interface MapStationDto {
  stationId: string
  organizationId: string
  regionId: string
  stationCode: string
  name: string
  nameAr?: string
  nameEn?: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  latitude: number
  longitude: number
  elevationMeters: number
  staffGaugeHeight: number
  currentWaterLevel: number | null
  waterLevelUnit: string | null
  lastReadingUtc: string | null
  category?: "hq" | "master" | "field"
  zoneAr?: string
  zoneEn?: string
  flowRate?: number | string
  pressureBar?: number | string
  quality?: string
  mechanism?: string
  signal?: string
}

export interface StationSummaryDto {
  stationId: string
  stationCode: string
  name: string
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  regionId: string
  latitude: number
  longitude: number
  lastReadingUtc: string | null
}

export interface StationDetailDto {
  stationId: string
  organizationId: string
  regionId: string
  stationCode: string
  name: string
  nameAr?: string
  nameEn?: string
  description: string | null
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE"
  latitude: number
  longitude: number
  elevationMeters: number
  staffGaugeHeight: number
  isActive: boolean
  lastObservedAtUtc?: string | null
  communicationIntervalSeconds: number | null
  createdAtUtc: string
  updatedAtUtc: string
  assignedParameters: StationParameterDto[]
  category?: "hq" | "master" | "field"
  zoneAr?: string
  zoneEn?: string
  mechanismAr?: string
  mechanismEn?: string
  signalAr?: string
  signalEn?: string
}

export interface StationParameterDto {
  parameterId: number
  code: string
  name: string
  canonicalUnit: string
  dataType: string
}

// ─── Telemetry ─────────────────────────────────────────────────────────────────
export interface TelemetryPointDto {
  stationId: string
  parameterId: number
  timestampUtc: string
  value: number
  canonicalUnit: string
  qualityFlag: "GOOD" | "SUSPECT" | "INVALID" | "MISSING"
}

export interface ChartSeriesDto {
  stationId: string
  parameterId: number
  parameterName: string
  unit: string
  points: ChartPointDto[]
}

export interface ChartPointDto {
  timestampUtc: string
  value: number
  qualityFlag: "GOOD" | "SUSPECT" | "INVALID"
}

// ─── Alarms ────────────────────────────────────────────────────────────────────
export interface AlarmDto {
  alarmId: string
  organizationId: string
  stationId: string
  stationName: string
  alarmTypeId: number
  alarmTypeCode: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED"
  raisedAtUtc: string
  acknowledgedAtUtc: string | null
  acknowledgedByEmail: string | null
  resolvedAtUtc: string | null
  resolvedByEmail: string | null
  message: string
  resolutionNote: string | null
  labels: AlarmLabelDto[]
  faultProbability?: number
}

export interface AlarmLabelDto {
  label: string
  confidence: number
  taggedByEmail: string
  taggedAtUtc: string
}

// ─── Chart Annotations ─────────────────────────────────────────────────────────
export interface ChartAnnotationDto {
  annotationId: number
  stationId: string
  parameterId: number
  parameterName: string
  timestampUtc: string
  text: string
  createdByEmail: string
  createdAtUtc: string
}

// ─── Collaboration ─────────────────────────────────────────────────────────────
export interface CollaborationNoteDto {
  noteId: number
  stationId: string
  parentNoteId: number | null
  noteText: string
  createdByEmail: string
  createdAtUtc: string
  replies: CollaborationNoteDto[]
}

// ─── Thresholds (read-only view) ───────────────────────────────────────────────
export interface ThresholdDto {
  thresholdId: number
  stationId: string
  stationName: string
  parameterId: number
  parameterName: string
  warningLow: number | null
  warningHigh: number | null
  criticalLow: number | null
  criticalHigh: number | null
  effectiveFromUtc: string
  effectiveToUtc: string | null
  isActive: boolean
  createdByEmail: string
  createdAtUtc: string
}

// ─── AI ────────────────────────────────────────────────────────────────────────
export interface AiInsightDto {
  insightType: string // 'anomaly' | 'forecast' | 'risk-score' | 'maintenance' | 'focus-stations' | 'clusters' | 'summary' | 'fault-probability'
  stationId: string | null
  payload: unknown
  generatedAtUtc: string
  modelVersion: string | null
  status?: string
}

export interface AiTelemetryObservation {
  timestampUtc: string
  value: number
  uncertaintyMeters?: number | null
}

export interface AiWaterLevelPayload {
  dahiti_id: number
  current_wse: number
  forecasts: {
    target_wse_1d: number
    target_wse_7d: number
    target_wse_14d: number
    target_wse_30d: number
  }
  water_level_state: string
  forecast_semantics: string
  evaluation?: Record<string, unknown>
}

export interface AiForecastPayload {
  forecastPoints: Array<{
    timestampUtc: string
    predictedValue: number // Water Level (m)
    upperConfidenceBound: number
    lowerConfidenceBound: number
    predictedFlow?: number // Discharge Flow Rate (L/s or m³/s)
    upperFlowBound?: number
    lowerFlowBound?: number
    predictedPressure?: number // Pipeline Pressure (bar)
  }>
}

export interface AiRiskScorePayload {
  riskScore: number // 0-100
  riskCategory: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  contributingFactors: string[]
}

export interface AiMaintenancePayload {
  predictions: Array<{
    equipmentComponent: string
    failureProbability: number // 0.0-1.0
    estimatedDaysToFailure: number
    recommendedAction: string
  }>
}

export interface AiFocusStationPayload {
  stations: Array<{
    stationId: string
    name: string
    stationCode: string
    riskScore: number
    primaryRiskFactor: string
  }>
}

export interface AiFaultProbabilityPayload {
  faultProbability: number // 0.0-1.0
  rootCauses: string[]
  suggestedLabel: string
}

export interface AiClusterPayload {
  clusters: Array<{
    clusterId: number
    clusterName: string
    stationIds: string[]
    centroidLatitude: number
    centroidLongitude: number
  }>
}

export interface AiAnomalyItem {
  id: string
  stationId: string
  stationName: string
  parameter: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  expectedValue: number | null
  actualValue: number | null
  unit: string
  confidenceScore: number
  detectedAtUtc: string
  status: "ACTIVE" | "ACKNOWLEDGED"
}

// ─── Reports ───────────────────────────────────────────────────────────────────
export interface ReportDto {
  reportId: string
  title: string
  reportType: "STATION_SUMMARY" | "ALARM_SUMMARY" | "TELEMETRY_EXPORT"
  format: "PDF" | "EXCEL" | "CSV"
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED"
  fileSizeBytes: number | null
  createdAtUtc: string
  completedAtUtc: string | null
}

export interface CreateReportRequest {
  title: string
  reportType: "STATION_SUMMARY" | "ALARM_SUMMARY" | "TELEMETRY_EXPORT"
  stationIds?: string[]
  fromUtc: string
  toUtc: string
  format: "PDF" | "EXCEL" | "CSV"
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export interface NotificationDto {
  notificationId: number
  title: string
  body: string
  channel: "IN_APP" | "EMAIL"
  isRead: boolean
  createdAtUtc: string
  readAtUtc: string | null
}

export interface NotificationPreferenceDto {
  channel: "EMAIL" | "IN_APP"
  alarmSeverity: "CRITICAL" | "WARNING" | "INFO"
  isEnabled: boolean
  dailyDigestEnabled: boolean
}

// ─── Settings ──────────────────────────────────────────────────────────────────
export interface UserPreferencesDto {
  theme: "dark" | "light" | "system"
  locale: string
  timeZone: string
  decimalPrecision: number // 0-4
}

export interface DashboardLayoutDto {
  id: number
  layoutName: string
  widgetsJson: string // JSON string
  isDefault: boolean
  updatedAtUtc: string
}

// ─── Search ────────────────────────────────────────────────────────────────────
export interface SearchResultDto {
  stations: MapStationDto[]
  alarms: AlarmDto[]
  reports: ReportDto[]
}

// ─── Sharing ───────────────────────────────────────────────────────────────────
export interface ShareSnapshotDto {
  snapshotId: string
  stationId: string
  shareToken: string
  snapshotJson: string // JSON string
  expiresAtUtc: string | null
  createdAtUtc: string
}

// ─── Error Envelope ────────────────────────────────────────────────────────────
export interface ApiErrorEnvelope {
  success: false
  errorCode: string
  message: string
  errors?: Record<string, string[]>
  traceId: string
}
