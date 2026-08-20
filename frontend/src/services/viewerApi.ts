import { ApiClient } from './apiClient';
import type { Alarm, AiInsight, Measurement, Overview, Report, Station } from './types';

export type ReturnTypeOfViewerApi = {
  getOverview: () => Promise<Overview>;
  getStations: (regionId: string) => Promise<Station[]>;
  getMeasurements: (stationId: string) => Promise<Measurement[]>;
  getAlarms: (stationId: string) => Promise<Alarm[]>;
  getReports: () => Promise<Report[]>;
  getInsights: () => Promise<AiInsight[]>;
};

export function createViewerApi(client = new ApiClient()) {
  return {
    getOverview: () => client.request<Overview>('/api/v1/viewer/overview'),
    getStations: (regionId: string) => client.request<Station[]>(`/api/v1/viewer/regions/${regionId}/stations`),
    getMeasurements: (stationId: string) => client.request<Measurement[]>(`/api/v1/viewer/stations/${stationId}/measurements`),
    getAlarms: (stationId: string) => client.request<Alarm[]>(`/api/v1/viewer/stations/${stationId}/alarms`),
    getReports: () => client.request<Report[]>('/api/v1/viewer/reports'),
    getInsights: () => client.request<AiInsight[]>('/api/v1/viewer/insights'),
  };
}

export const cacheKeys = {
  overview: ['viewer', 'overview'] as const,
  stations: (regionId: string) => ['viewer', 'stations', regionId] as const,
  measurements: (stationId: string) => ['viewer', 'measurements', stationId] as const,
  alarms: (stationId: string) => ['viewer', 'alarms', stationId] as const,
  reports: ['viewer', 'reports'] as const,
  insights: ['viewer', 'insights'] as const,
};
