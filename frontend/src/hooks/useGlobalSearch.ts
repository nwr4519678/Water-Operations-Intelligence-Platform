// src/hooks/useGlobalSearch.ts
import { useQuery } from "@tanstack/react-query"
import { searchApi } from "../api/search"
import { QUERY_KEYS } from "../utils/constants"
import { useDebounce } from "./useDebounce"

export function useGlobalSearch(rawQuery: string) {
  const debouncedQuery = useDebounce(rawQuery, 120)

  return useQuery({
    queryKey: [QUERY_KEYS.GLOBAL_SEARCH, debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    staleTime: 30000,
  })
}
