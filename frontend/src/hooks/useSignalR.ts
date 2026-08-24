// src/hooks/useSignalR.ts
import { useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import {
  signalRService,
  AlarmRaisedEvent,
  AlarmStateChangedEvent,
} from "../services/signalr"
import { useUiStore } from "../store/uiStore"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "../utils/constants"
import { TelemetryPointDto } from "../types/api"

export function useSignalR() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const addToast = useUiStore((state) => state.addToast)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken) return

    signalRService.start(accessToken)

    const handleAlarmRaised = (event: AlarmRaisedEvent) => {
      addToast({
        type: "alarm",
        title: `Alarm Raised: ${event.severity}`,
        message: `${event.stationName} — ${event.message}`,
      })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWER_OVERVIEW] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALARMS_LIST] })
    }

    const handleAlarmStateChanged = (event: AlarmStateChangedEvent) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIEWER_OVERVIEW] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALARMS_LIST] })
    }

    const handleTelemetryReceived = (data: TelemetryPointDto) => {
      // Invalidate chart measurements on telemetry point arrival
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHART_MEASUREMENTS, data.stationId],
      })
    }

    signalRService.onAlarmRaised(handleAlarmRaised)
    signalRService.onAlarmStateChanged(handleAlarmStateChanged)
    signalRService.onTelemetryReceived(handleTelemetryReceived)

    return () => {
      signalRService.off("AlarmRaised", handleAlarmRaised)
      signalRService.off("AlarmStateChanged", handleAlarmStateChanged)
      signalRService.off("TelemetryReceived", handleTelemetryReceived)
      signalRService.stop()
    }
  }, [accessToken, addToast, queryClient])
}
