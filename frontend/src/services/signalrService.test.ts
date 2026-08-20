import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { mapLiveEventToCache, reconnectDelays } from './signalrService';

describe('SignalR cache mapping', () => {
  it('invalidates station detail and overview caches for live events', () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    mapLiveEventToCache(client, 'MeasurementUpdated', 'station-1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['viewer', 'measurements', 'station-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['viewer', 'overview'] });
  });
  it('uses bounded automatic reconnect delays', () => {
    expect(reconnectDelays).toEqual([0, 2_000, 10_000, 30_000]);
  });
});
