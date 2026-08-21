import type { TelemetrySnapshot } from './telemetry';

export type RealtimeEvent = { type: 'snapshot.updated'; payload: TelemetrySnapshot };

export interface RealtimePort {
  connect(onEvent: (event: RealtimeEvent) => void): () => void;
}

/** Production SignalR/WebSocket wiring belongs behind this port. */
export const realtimePort: RealtimePort = {
  connect() {
    return () => undefined;
  },
};
