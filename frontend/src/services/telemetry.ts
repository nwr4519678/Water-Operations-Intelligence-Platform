import type { Alarm, Station } from '../types/telemetry';

export type TelemetrySnapshot = { stations: Station[]; alarms: Alarm[] };

export interface TelemetryPort {
  getSnapshot(): Promise<TelemetrySnapshot>;
}

export const telemetryPort: TelemetryPort = {
  async getSnapshot() {
    return { stations: [], alarms: [] };
  },
};
