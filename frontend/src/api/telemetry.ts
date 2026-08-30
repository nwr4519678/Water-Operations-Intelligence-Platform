// src/api/telemetry.ts
import { apiClient } from './client';
import { ChartSeriesDto, TelemetryPointDto } from '../types/api';

export const telemetryApi = {
  getTelemetry: async (params?: { stationId?: string; parameterId?: number; from?: string; to?: string; limit?: number }): Promise<TelemetryPointDto[]> => {
    const res = await apiClient.get<TelemetryPointDto[]>('/api/v1/telemetry', { params });
    return res.data;
  },

  getChartMeasurements: async (params: { stationId: string; parameterId?: number[]; from: string; to: string; limit?: number }): Promise<ChartSeriesDto[]> => {
    const res = await apiClient.get<ChartSeriesDto[]>('/api/v1/charts/measurements', { params });
    return res.data;
  }
};

