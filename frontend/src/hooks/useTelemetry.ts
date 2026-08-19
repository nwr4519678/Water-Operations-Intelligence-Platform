import { useEffect, useState } from 'react'
import type { TelemetryPoint } from '../types'
import { getTelemetry } from '../services/mockData'
import { startMockTelemetry } from '../services/mockWebSocket'

export function useTelemetry(stationId: string): TelemetryPoint[] {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(() => getTelemetry(stationId))
  useEffect(() => { setTelemetry(getTelemetry(stationId)); return startMockTelemetry(stationId, (point) => setTelemetry((previous) => [...previous.slice(-47), point])) }, [stationId])
  return telemetry
}
