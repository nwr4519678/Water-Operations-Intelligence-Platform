import { describe, expect, it } from 'vitest';
import { ApiClientError } from './types';
import { queryClient } from './queryClient';

describe('query cache policy', () => {
  it('marks viewer data stale after 30 seconds', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });
  it('does not amplify authorization or timeout failures', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry as (count: number, error: Error) => boolean;
    expect(retry(0, new ApiClientError(401, 'unauthorized'))).toBe(false);
    expect(retry(0, new ApiClientError(403, 'forbidden'))).toBe(false);
    expect(retry(0, new ApiClientError(408, 'timeout'))).toBe(false);
    expect(retry(0, new ApiClientError(500, 'server error'))).toBe(true);
    expect(retry(2, new ApiClientError(500, 'server error'))).toBe(false);
  });
});
