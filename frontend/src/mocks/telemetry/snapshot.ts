import type { TelemetrySnapshot } from '../../services/telemetry';

export const telemetrySnapshot: TelemetrySnapshot = {
  stations: [
    {
      id: 'ST-045',
      name: 'River Pump Station',
      district: 'Central',
      status: 'healthy',
      waterLevelMeters: 2.85,
      flowRateLitresPerSecond: 320,
      pressureBar: 4.2,
      quality: 'good',
      updatedAt: '2026-08-20T10:41:58Z',
    },
    {
      id: 'ST-078',
      name: 'North District',
      district: 'North',
      status: 'healthy',
      waterLevelMeters: 1.62,
      flowRateLitresPerSecond: 185,
      pressureBar: 2.8,
      quality: 'good',
      updatedAt: '2026-08-20T10:41:20Z',
    },
  ],
  alarms: [
    {
      id: 'AL-001',
      stationId: 'ST-045',
      title: 'High Water Level',
      severity: 'critical',
      message: 'Level is above the configured threshold.',
      createdAt: '2026-08-20T10:35:00Z',
      acknowledged: false,
    },
    {
      id: 'AL-002',
      stationId: 'ST-078',
      title: 'Low Pressure',
      severity: 'warning',
      message: 'Pressure is below the expected operating range.',
      createdAt: '2026-08-20T10:28:00Z',
      acknowledged: false,
    },
  ],
};
