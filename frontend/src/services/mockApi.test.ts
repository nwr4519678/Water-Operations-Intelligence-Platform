import { describe, expect, it } from 'vitest';
import { createMockViewerApi } from './mockApi';
import { mockFailures } from './mockFixtures';

describe('mock viewer API', () => {
  it('keeps core fixtures available when AI data is unavailable', async () => {
    const api = createMockViewerApi();
    await expect(api.getStations('region-1')).resolves.toHaveLength(1);
    await expect(api.getInsights()).resolves.toHaveLength(1);
    await expect(Promise.reject(new Error('AI unavailable'))).rejects.toThrow('AI unavailable');
  });
  it('provides an explicit empty-data fixture', () => {
    expect(mockFailures.empty()).toEqual([]);
  });
});
