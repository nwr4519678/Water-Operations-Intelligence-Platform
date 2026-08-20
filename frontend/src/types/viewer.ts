export type StationStatus = 'healthy' | 'attention' | 'critical' | 'offline';
export type Station = { id: string; name: string; district: string; status: StationStatus; level: number; flow: number; quality: number; updated: string; x: number; y: number };
export type Alarm = { id: string; stationId: string; station: string; severity: 'critical' | 'warning' | 'info'; message: string; time: string; state: 'Open' | 'Monitoring' };
export type Measurement = { time: string; flow: number; level: number };
export type Report = { id: string; title: string; period: string; generated: string; scope: string; status: 'Ready' | 'Processing' };
export type InsightState = 'available' | 'learning' | 'unavailable' | 'stale' | 'empty' | 'error';
export type Insight = { id: string; title: string; body: string; confidence: number; state: InsightState; source: string };

export type Locale = 'en' | 'ar';
