import type { TelemetryPoint } from '../types'
import { getTelemetry, makeNewTelemetry } from './mockData'

export function startMockTelemetry(stationId: string, onData: (point: TelemetryPoint) => void, intervalMs = 2500): () => void {
  let last = getTelemetry(stationId, 1)[0]
  const timer = window.setInterval(() => { last = makeNewTelemetry(stationId, last); onData(last) }, intervalMs)
  return () => window.clearInterval(timer)
}
