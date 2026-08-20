import type { DataQuality, Severity, StatusTone } from './types'

const statusLabels: Record<StatusTone, string> = {
  healthy: 'Healthy',
  attention: 'Attention',
  critical: 'Critical',
  offline: 'Offline',
  unknown: 'Unknown',
}

const severityLabels: Record<Severity, string> = {
  info: 'Info',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const qualityLabels: Record<DataQuality, string> = {
  verified: 'Verified',
  estimated: 'Estimated',
  stale: 'Stale',
  missing: 'Missing',
}

interface BadgeProps {
  className?: string
  label?: string
}

export function StatusBadge({ tone, label, className = '' }: BadgeProps & { tone: StatusTone }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      <span className="badge__dot" aria-hidden="true" />
      {label ?? statusLabels[tone]}
    </span>
  )
}

export function SeverityBadge({ severity, label, className = '' }: BadgeProps & { severity: Severity }) {
  return (
    <span className={`badge badge--${severity} ${className}`.trim()}>
      <span className="badge__icon" aria-hidden="true">!</span>
      {label ?? severityLabels[severity]}
    </span>
  )
}

export function DataQualityBadge({ quality, label, className = '' }: BadgeProps & { quality: DataQuality }) {
  return (
    <span className={`badge badge--quality-${quality} ${className}`.trim()}>
      <span className="badge__icon" aria-hidden="true">{quality === 'verified' ? '✓' : '~'}</span>
      {label ?? qualityLabels[quality]}
    </span>
  )
}

export function AiConfidenceBadge({ confidence }: { confidence: number }) {
  const boundedConfidence = Math.max(0, Math.min(100, Math.round(confidence)))
  const tone: StatusTone = boundedConfidence >= 80 ? 'healthy' : boundedConfidence >= 60 ? 'attention' : 'critical'

  return <StatusBadge tone={tone} label={`AI confidence ${boundedConfidence}%`} />
}
