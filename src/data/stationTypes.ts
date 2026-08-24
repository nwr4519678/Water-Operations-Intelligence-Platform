// src/data/stationTypes.ts

export type StationType = "main" | "master" | "rtu"
export type ConnectionState = "online" | "warning" | "offline" | "unknown"

export interface TelemetrySnapshot {
  flowRate?: number | string
  flowUnit?: string
  pressure?: number | string
  waterLevel?: number | string
  waterQuality?: number | string
  pumpState?: "running" | "stopped" | "standby"
  batteryLevel?: number
  signalStrength?: number
  lastUpdateUtc?: string
  isSimulated?: boolean
}

export interface WaterStation {
  id: string
  code: string
  name: string
  nameAr?: string
  nameEn?: string
  type: StationType
  typeLabel: string
  region: string
  latitude: number
  longitude: number
  coordinates: [number, number] // [longitude, latitude] for deck.gl/GeoJSON
  connectionStatus: string
  connectionState: ConnectionState
  telemetrySnapshot?: TelemetrySnapshot
}

export interface BoundingBox {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  centerLng: number
  centerLat: number
}

export interface DatasetValidationReport {
  totalRows: number
  validCount: number
  invalidCount: number
  mainCount: number
  masterCount: number
  rtuCount: number
  onlineCount: number
  warningCount: number
  offlineCount: number
  unknownCount: number
  regions: string[]
  bounds: BoundingBox
  errors: string[]
}
