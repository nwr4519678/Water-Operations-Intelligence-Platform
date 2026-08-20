import { mockFixtures } from './mockFixtures';
import { createViewerApi } from './viewerApi';
import type { ApiClient } from './apiClient';
import type { ReturnTypeOfViewerApi } from './viewerApi';

export function createMockViewerApi(): ReturnTypeOfViewerApi {
  return {
    getOverview: async () => mockFixtures.overview,
    getStations: async () => mockFixtures.stations,
    getMeasurements: async () => mockFixtures.measurements,
    getAlarms: async () => mockFixtures.alarms,
    getReports: async () => mockFixtures.reports,
    getInsights: async () => mockFixtures.insights,
  };
}

export function createConfiguredViewerApi(client: ApiClient, useMocks = import.meta.env.VITE_MOCK_SERVICES === 'true') {
  return useMocks ? createMockViewerApi() : createViewerApi(client);
}
