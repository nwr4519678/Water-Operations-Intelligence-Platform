import type { TelemetryStatus } from '../../types/telemetry';

export function StatusBadge({ status }: { status: TelemetryStatus }) {
  return <span className={`status-badge status-badge--${status}`} aria-label={`Status: ${status}`}>{status}</span>;
}
