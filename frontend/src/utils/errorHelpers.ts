// src/utils/errorHelpers.ts
import axios from 'axios';
import type { ApiErrorEnvelope } from '../types/api';

export interface NormalizedError {
  code: string;
  message: string;
  fieldErrors: Record<string, string[]>;
  traceId: string;
}

export function extractApiError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const envelope = error.response.data as Partial<ApiErrorEnvelope>;
    return {
      code: envelope.errorCode ?? `HTTP_${error.response.status}`,
      message: envelope.message ?? 'An unexpected error occurred.',
      fieldErrors: envelope.errors ?? {},
      traceId: envelope.traceId ?? '',
    };
  }
  if (error instanceof Error) {
    return { code: 'CLIENT_ERROR', message: error.message, fieldErrors: {}, traceId: '' };
  }
  return { code: 'NETWORK_ERROR', message: 'Network request failed.', fieldErrors: {}, traceId: '' };
}
