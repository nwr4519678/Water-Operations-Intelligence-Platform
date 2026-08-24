// src/hooks/useGlobalSearch.ts
import { useQuery } from "@tanstack/react-query"
import { searchApi } from "../api/search"
import { QUERY_KEYS } from "../utils/constants"
import { useDebounce } from "./useDebounce"

export function useGlobalSearch(rawQuery: string) {
  const debouncedQuery = useDebounce(rawQuery, 300)

  return useQuery({
    queryKey: [QUERY_KEYS.GLOBAL_SEARCH, debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 30000,
  })
}
