import type { Alarm, Insight, Measurement, Report, Station } from '../types/viewer';

export const stations: Station[] = [
  { id: 'north-intake', name: 'North Intake', district: 'North District', status: 'healthy', level: 2.45, flow: 48.2, quality: 96, updated: '2 min ago', x: 24, y: 32 },
  { id: 'east-pump', name: 'East Pump', district: 'East District', status: 'attention', level: 1.82, flow: 32.8, quality: 88, updated: '4 min ago', x: 67, y: 28 },
  { id: 'central-reservoir', name: 'Central Reservoir', district: 'Central District', status: 'healthy', level: 3.14, flow: 62.4, quality: 94, updated: '1 min ago', x: 48, y: 57 },
  { id: 'south-outfall', name: 'South Outfall', district: 'South District', status: 'offline', level: 0, flow: 0, quality: 0, updated: '38 min ago', x: 73, y: 76 },
  { id: 'west-treatment', name: 'West Treatment', district: 'West District', status: 'critical', level: 1.12, flow: 18.6, quality: 71, updated: '3 min ago', x: 21, y: 73 },
];
export const alarms: Alarm[] = [
  { id: 'a-1', stationId: 'east-pump', station: 'East Pump', severity: 'critical', message: 'Pressure above operating threshold', time: '08:42', state: 'Open' },
  { id: 'a-2', stationId: 'west-treatment', station: 'West Treatment', severity: 'warning', message: 'Water quality sensor needs review', time: '08:16', state: 'Monitoring' },
  { id: 'a-3', stationId: 'north-intake', station: 'North Intake', severity: 'info', message: 'Scheduled telemetry check completed', time: '07:55', state: 'Monitoring' },
];
export const measurements: Measurement[] = [
  { time: '00:00', flow: 42, level: 2.1 }, { time: '04:00', flow: 45, level: 2.2 }, { time: '08:00', flow: 51, level: 2.5 }, { time: '12:00', flow: 48, level: 2.45 }, { time: '16:00', flow: 56, level: 2.7 }, { time: '20:00', flow: 52, level: 2.6 },
];
export const reports: Report[] = [
  { id: 'r-1', title: 'Daily network operations', period: '19 Aug 2026', generated: 'Today, 06:00', scope: 'All districts', status: 'Ready' },
  { id: 'r-2', title: 'Weekly water quality review', period: '12–18 Aug 2026', generated: '18 Aug 2026', scope: 'North + Central', status: 'Ready' },
  { id: 'r-3', title: 'Monthly station availability', period: 'July 2026', generated: '01 Aug 2026', scope: 'All districts', status: 'Ready' },
];
export const insights: Insight[] = [
  { id: 'i-1', title: 'Elevated demand expected', body: 'Flow across the north district is trending 8% above the seasonal baseline for the next 6 hours.', confidence: 92, state: 'available', source: 'North District · 24h telemetry' },
  { id: 'i-2', title: 'Station profile learning', body: 'The model is learning this station profile. Check back after more observations.', confidence: 0, state: 'learning', source: 'South Outfall' },
];
