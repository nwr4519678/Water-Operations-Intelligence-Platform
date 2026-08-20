import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from './apiClient';

const envelope = (data: unknown, traceId = 'trace-1') => new Response(JSON.stringify({ success: true, data, error: null, traceId }), { status: 200 });

describe('ApiClient', () => {
  it('unwraps envelopes and preserves trace-aware failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope({ value: 1 }));
    await expect(new ApiClient({ fetcher }).request<{ value: number }>('/test')).resolves.toEqual({ value: 1 });
    const failed = new Response(JSON.stringify({ success: false, data: null, error: { code: 'denied', message: 'No access' }, traceId: 'trace-403' }), { status: 403 });
    await expect(new ApiClient({ fetcher: vi.fn<typeof fetch>().mockResolvedValue(failed) }).request('/test')).rejects.toMatchObject({ status: 403, traceId: 'trace-403', code: 'denied' });
  });

  it('refreshes exactly once after 401 and does not retry forbidden responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(envelope('ok'));
    const onUnauthorized = vi.fn().mockResolvedValue(true);
    await expect(new ApiClient({ fetcher, tokenProvider: { getAccessToken: () => 'token', onUnauthorized } }).request('/test')).resolves.toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(2);
    const forbidden = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 403 }));
    await expect(new ApiClient({ fetcher: forbidden }).request('/test')).rejects.toMatchObject({ status: 403 });
    expect(forbidden).toHaveBeenCalledTimes(1);
  });

  it('turns an aborted request into a timeout error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
    await expect(new ApiClient({ fetcher, timeoutMs: 1 }).request('/slow')).rejects.toMatchObject({ status: 408 });
  });
});
