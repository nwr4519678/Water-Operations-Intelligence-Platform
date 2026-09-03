// src/hooks/useThresholdsQuery.ts
import { useQuery } from "@tanstack/react-query"
import { thresholdsApi } from "../api/thresholds"
import { QUERY_KEYS } from "../utils/constants"

export function useThresholdsList(stationId?: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.THRESHOLDS, stationId],
    queryFn: () => thresholdsApi.listThresholds({ stationId }),
    enabled: Boolean(stationId) && enabled,
  })
}
