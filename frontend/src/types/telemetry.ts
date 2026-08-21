export type TelemetryStatus = 'healthy' | 'attention' | 'offline' | 'unknown';

export type Station = {
  id: string;
  name: string;
  district: string;
  status: TelemetryStatus;
  waterLevelMeters: number;
  flowRateLitresPerSecond: number;
  pressureBar: number;
  quality: 'good' | 'fair' | 'poor';
  updatedAt: string;
};

export type AlarmSeverity = 'critical' | 'warning' | 'info';

export type Alarm = {
  id: string;
  stationId: string;
  title: string;
  severity: AlarmSeverity;
  message: string;
  createdAt: string;
  acknowledged: boolean;
};

export type QueryState<T> =
  | { status: 'loading'; data?: T }
  | { status: 'success'; data: T; updatedAt: string }
  | { status: 'error'; error: string; data?: T }
  | { status: 'offline'; data?: T }
  | { status: 'stale'; data: T; updatedAt: string };
