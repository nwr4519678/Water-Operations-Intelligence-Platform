import type { Alarm, AiInsight, Measurement, Overview, Report, Station } from './types';

export const mockFixtures = {
  overview: { activeStations: 2, averageWaterLevel: 2.45, openAlarms: 1, waterQuality: 92 } satisfies Overview,
  stations: [{ id: 'station-1', regionId: 'region-1', name: 'North Reservoir' }] satisfies Station[],
  measurements: [{ id: 'measurement-1', stationId: 'station-1', recordedAt: '2026-08-20T08:00:00Z', value: 2.45, unit: 'm' }] satisfies Measurement[],
  alarms: [{ id: 'alarm-1', stationId: 'station-1', raisedAt: '2026-08-20T07:00:00Z', severity: 'Warning', message: 'Synthetic local development alarm' }] satisfies Alarm[],
  reports: [{ id: 'report-1', title: 'Daily operations report', createdAt: '2026-08-20T06:00:00Z', status: 'Ready' }] satisfies Report[],
  insights: [{ id: 'insight-1', title: 'Reservoir level trend', summary: 'Levels are stable over the last 24 hours.', confidence: 94 }] satisfies AiInsight[],
};

export const mockFailures = {
  unauthorized: () => new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401 }),
  forbidden: () => new Response(JSON.stringify({ error: 'scope_forbidden' }), { status: 403 }),
  timeout: () => new DOMException('The request timed out', 'AbortError'),
  empty: <T,>() => [] as T[],
};
