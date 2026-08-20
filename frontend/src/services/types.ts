export type ApiError = { code: string; message: string };
export type ApiEnvelope<T> = { success: boolean; data: T | null; error: ApiError | null; traceId: string };
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: number; expiresAt?: number };
export type Station = { id: string; regionId: string; name: string };
export type Measurement = { id: string; stationId: string; recordedAt: string; value: number; unit: string };
export type Alarm = { id: string; stationId: string; raisedAt: string; severity: string; message: string };
export type Overview = { activeStations: number; averageWaterLevel: number; openAlarms: number; waterQuality: number };
export type Report = { id: string; title: string; createdAt: string; status: string };
export type AiInsight = { id: string; title: string; summary: string; confidence: number };

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string, public readonly traceId?: string, public readonly code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}
