// src/api/ai.ts
import { apiClient } from './client';
import {
  AiInsightDto,
  PagedResult
} from '../types/api';

export const aiApi = {
  anomalies: async (params?: { page?: number; pageSize?: number }): Promise<PagedResult<AiInsightDto>> => {
    const res = await apiClient.get<PagedResult<AiInsightDto>>('/api/v1/ai/anomalies', { params });
    return res.data;
  },

  focusStations: async (asOfUtc?: string): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>('/api/v1/ai/focus-stations', { params: { asOfUtc } });
    return res.data;
  },

  forecast: async (stationId: string, asOfUtc?: string): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>(`/api/v1/ai/forecast/${stationId}`, { params: { asOfUtc } });
    return res.data;
  },

  riskScore: async (params?: { stationId?: string; asOfUtc?: string }): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>('/api/v1/ai/risk-score', { params });
    return res.data;
  },

  maintenance: async (params?: { stationId?: string; asOfUtc?: string }): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>('/api/v1/ai/maintenance/predictions', { params });
    return res.data;
  },

  clusters: async (asOfUtc?: string): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>('/api/v1/ai/stations/clusters', { params: { asOfUtc } });
    return res.data;
  },

  reportSummary: async (reportId: string): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>(`/api/v1/ai/reports/${reportId}/summary`);
    return res.data;
  },

  faultProbability: async (alarmId: string): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>(`/api/v1/ai/alarms/${alarmId}/fault-probability`);
    return res.data;
  },

  stationInsight: async (stationId: string, insightType: string = 'anomaly'): Promise<AiInsightDto> => {
    const res = await apiClient.get<AiInsightDto>(`/api/v1/ai/insights/${stationId}`, { params: { insightType } });
    return res.data;
  }
};

