export type StationStatus = 'healthy' | 'offline' | 'warning'
export type AlarmSeverity = 'critical' | 'warning' | 'info'
export type QualityFlag = 'good' | 'suspicious' | 'sensor-error'

export interface Station {
  id: string
  name: string
  location: string
  locationAr: string
  type: 'Tide Gauge Station'
  status: StationStatus
  latitude: number
  longitude: number
  description: string
  lastSeen: string
  battery: number
  signal: number
  storage: number
  cloudSync: boolean
  bannerTone: 'delta' | 'desert'
}

export interface TelemetryPoint {
  timestamp: string
  label: string
  upstream: number
  downstream: number
  battery: number
  signal: number
  quality: QualityFlag
  anomaly: boolean
}

export interface Alarm {
  id: string
  stationId: string
  title: string
  description: string
  severity: AlarmSeverity
  createdAt: string
  acknowledged: boolean
}

export interface Report {
  id: string
  stationId: string
  name: string
  range: string
  createdAt: string
  finishedAt: string
  rows: number
  status: 'Finished' | 'Processing'
}

export interface AuthSession {
  token: string
  email: string
  expiresAt: number
}

export interface LoginResult {
  success: boolean
  message?: string
}
