// src/api/thresholds.ts
import { apiClient } from './client';
import { PagedResult, ThresholdDto } from '../types/api';

export const thresholdsApi = {
  listThresholds: async (params?: { stationId?: string; parameterId?: number; page?: number; pageSize?: number }): Promise<PagedResult<ThresholdDto>> => {
    const res = await apiClient.get<PagedResult<ThresholdDto>>('/api/v1/thresholds', { params });
    return res.data;
  }
};

