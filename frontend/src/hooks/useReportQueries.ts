// src/hooks/useReportQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { reportsApi } from "../api/reports"
import { CreateReportRequest } from "../types/api"
import { QUERY_KEYS } from "../utils/constants"

export function useReportsList(params?: {
  reportType?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS_LIST, params],
    queryFn: () => reportsApi.listReports(params),
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReportRequest) => reportsApi.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_LIST] })
    },
  })
}
