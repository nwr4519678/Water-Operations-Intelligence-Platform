import { ApiClientError, type ApiEnvelope } from './types';

export type TokenProvider = { getAccessToken: () => string | null; onUnauthorized: () => Promise<boolean> };
export type ApiClientOptions = { baseUrl?: string; fetcher?: typeof fetch; tokenProvider?: TokenProvider; mock?: boolean; timeoutMs?: number };

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  constructor(private readonly options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? '';
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async request<T>(path: string, init: RequestInit = {}, retryUnauthorized = true): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const token = this.options.tokenProvider?.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      if (response.status === 401 && retryUnauthorized && this.options.tokenProvider && await this.options.tokenProvider.onUnauthorized()) return this.request<T>(path, init, false);
      const body = await response.json().catch(() => null) as ApiEnvelope<T> | { error?: string } | null;
      if (!response.ok) {
        const message = body && 'error' in body ? typeof body.error === 'string' ? body.error : body.error?.message : undefined;
        const traceId = body && 'traceId' in body ? body.traceId : response.headers.get('x-trace-id') ?? undefined;
        const code = body && 'success' in body && body.error ? body.error.code : undefined;
        throw new ApiClientError(response.status, message ?? response.statusText, traceId, code);
      }
      if (body && 'success' in body) {
        if (!body.success) throw new ApiClientError(response.status, body.error?.message ?? 'API request failed', body.traceId, body.error?.code);
        return body.data as T;
      }
      return body as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new ApiClientError(408, 'Request timed out');
      throw error;
    } finally { clearTimeout(timeout); }
  }
}
