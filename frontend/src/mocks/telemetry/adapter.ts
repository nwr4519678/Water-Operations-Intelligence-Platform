import { telemetrySnapshot } from './snapshot';
import type { TelemetryPort } from '../../services/telemetry';

export const mockTelemetryAdapter: TelemetryPort = {
  async getSnapshot() {
    return telemetrySnapshot;
  },
};
