import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: (failureCount, error) => error instanceof Error && 'status' in error && [401, 403, 408].includes(Number(error.status)) ? false : failureCount < 2, refetchOnWindowFocus: false } } });
