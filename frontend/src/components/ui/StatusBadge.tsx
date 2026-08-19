import type { AlarmSeverity, StationStatus } from '../../types'

const statusLabels: Record<StationStatus, string> = { healthy: 'Healthy', warning: 'Needs attention', offline: 'Offline' }
export function StatusBadge({ status }: { status: StationStatus }) { return <span className={`status-badge ${status}`}><i />{statusLabels[status]}</span> }
export function SeverityBadge({ severity }: { severity: AlarmSeverity }) { return <span className={`severity-badge ${severity}`}>{severity}</span> }
