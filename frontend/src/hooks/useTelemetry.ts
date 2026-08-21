import { useQuery } from '@tanstack/react-query';
import { mockTelemetryAdapter } from '../mocks/telemetry/adapter';

export function useTelemetry() {
  return useQuery({
    queryKey: ['telemetry', 'snapshot'],
    queryFn: () => mockTelemetryAdapter.getSnapshot(),
    staleTime: 30_000,
  });
}
